using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.Models;

using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;

    public TransactionsController(AppDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    // F4: Admin - Create purchase invoices for stock updates
    [Authorize(Roles = "Admin")]
    [HttpPost("purchase")]
    public async Task<ActionResult<Invoice>> CreatePurchase(Invoice invoice)
    {
        invoice.Type = InvoiceType.Purchase;
        invoice.Date = DateTime.UtcNow;
        
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Invoices.Add(invoice);
            
            foreach (var item in invoice.Items)
            {
                var part = await _context.Parts.FindAsync(item.PartId);
                if (part != null)
                {
                    part.StockLevel += item.Quantity; // Increase stock
                }
            }
            
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            return Ok(invoice);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            return BadRequest("Failed to process purchase invoice.");
        }
    }

    // F7: Staff - Sell vehicle parts and create sales invoices
    [Authorize(Roles = "Admin,Staff")]
    [HttpPost("sale")]
    public async Task<ActionResult<Invoice>> CreateSale(Invoice invoice)
    {
        invoice.Type = InvoiceType.Sale;
        invoice.Date = DateTime.UtcNow;
        invoice.IsPaid = invoice.PaymentStatus == null || invoice.PaymentStatus == "full-payment";
        
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Invoices.Add(invoice);
            
            // F16: Loyalty Program - 10% discount if spend > 5000
            if (invoice.TotalAmount > 5000)
            {
                invoice.TotalAmount *= 0.9m; // Apply 10% discount
            }
            
            foreach (var item in invoice.Items)
            {
                var part = await _context.Parts.FindAsync(item.PartId);
                if (part == null || part.StockLevel < item.Quantity)
                {
                    return BadRequest($"Part {item.PartId} is out of stock or insufficient.");
                }
                
                part.StockLevel -= item.Quantity; // Decrease stock
                
                // F15: System notification for low stock (< 10)
                if (part.StockLevel < 10)
                {
                    Console.WriteLine($"[NOTIFICATION] Admin: Part {part.Name} (Code: {part.PartCode}) is low on stock: {part.StockLevel} units remaining.");
                    await _emailService.SendEmailAsync("admin@vehicleinventory.com", "Low Stock Alert", $"Part {part.Name} (Code: {part.PartCode}) is low on stock. Only {part.StockLevel} units remain.");
                }
            }
            
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            return Ok(invoice);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            return BadRequest("Failed to process sales invoice.");
        }
    }

    // F11: Staff - Send invoices via email to customers
    [Authorize(Roles = "Admin,Staff")]
    [HttpPost("{invoiceId}/email")]
    public async Task<ActionResult> EmailInvoice(int invoiceId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Items)
            .ThenInclude(ii => ii.Part)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice == null)
            return NotFound(new { message = "Invoice not found." });

        if (invoice.Type != InvoiceType.Sale)
            return BadRequest(new { message = "Only sale invoices can be emailed." });

        var customer = await _context.Users.FindAsync(invoice.CustomerId);
        if (customer == null)
            return BadRequest(new { message = "Customer not found for this invoice." });

        if (string.IsNullOrEmpty(customer.Email))
            return BadRequest(new { message = $"Customer '{customer.Name}' has no email address on file." });

        var paymentLabel = invoice.PaymentStatus switch
        {
            "full-payment" => "Full Payment",
            "half-payment" => "Half Payment (50%)",
            "partial-payment" => "Partial Payment (10%)",
            _ => invoice.IsPaid ? "Paid" : "Unpaid"
        };

        var itemsRows = string.Join("\n", invoice.Items.Select(i => $@"
          <tr>
            <td style='padding:8px 12px;border-bottom:1px solid #e2e8f0'>{i.Part?.Name ?? $"Part #{i.PartId}"}</td>
            <td style='padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center'>{i.Quantity}</td>
            <td style='padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right'>Rs. {i.UnitPrice:N2}</td>
            <td style='padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right'>Rs. {(i.Quantity * i.UnitPrice):N2}</td>
          </tr>"));

        string body = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='margin:0;padding:0;font-family:Arial,sans-serif;background:#f1f5f9'>
  <table style='max-width:600px;margin:auto;margin-top:24px;background:#fff;border-radius:12px;overflow:hidden'>
    <tr><td style='background:#1e3a5f;padding:24px;text-align:center;color:#fff'>
      <h1 style='margin:0;font-size:20px'>Vehicle Inventory System</h1>
      <p style='margin:8px 0 0;opacity:0.8'>Invoice #{invoice.Id}</p>
    </td></tr>
    <tr><td style='padding:24px'>
      <p style='margin:0 0 4px'>Dear <strong>{customer.Name}</strong>,</p>
      <p style='margin:0 0 16px;color:#475569'>Thank you for your business. Here are the details of your invoice.</p>

      <table style='width:100%;margin-bottom:16px;font-size:14px'>
        <tr><td style='color:#64748b;padding:4px 0'>Invoice Date</td><td style='text-align:right'>{invoice.Date.ToShortDateString()}</td></tr>
        <tr><td style='color:#64748b;padding:4px 0'>Payment Status</td><td style='text-align:right'>{paymentLabel}</td></tr>
      </table>

      <table style='width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px'>
        <thead>
          <tr style='background:#f8fafc'>
            <th style='padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0'>Item</th>
            <th style='padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0'>Qty</th>
            <th style='padding:8px 12px;text-align:right;border-bottom:2px solid #e2e8f0'>Unit Price</th>
            <th style='padding:8px 12px;text-align:right;border-bottom:2px solid #e2e8f0'>Total</th>
          </tr>
        </thead>
        <tbody>{itemsRows}</tbody>
      </table>

      <div style='background:#f8fafc;padding:16px;border-radius:8px;text-align:right;font-size:16px;font-weight:700'>
        Total Amount: Rs. {invoice.TotalAmount:N2}
      </div>

      <p style='margin-top:24px;font-size:13px;color:#64748b;text-align:center'>
        <strong>Vehicle Inventory System</strong><br>
        Thank you for choosing us.
      </p>
    </td></tr>
  </table>
</body>
</html>";

        await _emailService.SendEmailAsync(customer.Email, $"Invoice #{invoice.Id} — Vehicle Inventory System", body);

        return Ok(new { message = $"Invoice #{invoiceId} emailed to {customer.Email}." });
    }

    // F12: Get full history for dashboard
    [Authorize(Roles = "Admin,Staff")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetHistory()
    {
        var invoices = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Items)
            .OrderByDescending(i => i.Date)
            .Select(i => new {
                i.Id,
                CustomerName = i.Customer != null ? i.Customer.Name : "Walk-in",
                i.TotalAmount,
                i.Date,
                Items = i.Items.Select(ii => new { ii.PartId, ii.Quantity, ii.UnitPrice })
            })
            .ToListAsync();
        return Ok(invoices);
    }
}
