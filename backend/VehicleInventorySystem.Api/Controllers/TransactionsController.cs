using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.Models;

using VehicleInventorySystem.Api.Services;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
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
    [HttpPost("sale")]
    public async Task<ActionResult<Invoice>> CreateSale(Invoice invoice)
    {
        invoice.Type = InvoiceType.Sale;
        invoice.Date = DateTime.UtcNow;
        
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
    [HttpPost("{invoiceId}/email")]
    public async Task<ActionResult> EmailInvoice(int invoiceId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Items)
            .ThenInclude(ii => ii.Part)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice == null) return NotFound("Invoice not found.");
        
        var customer = await _context.Users.FindAsync(invoice.CustomerId);
        if (customer == null || string.IsNullOrEmpty(customer.Email)) return BadRequest("Customer email not found.");

        string itemsHtml = string.Join("\n", invoice.Items.Select(i => $"- {i.Part?.Name}: {i.Quantity} x Rs. {i.UnitPrice}"));
        string body = $"Dear {customer.Name},\n\nThank you for your business. Here are your invoice details:\nInvoice ID: {invoice.Id}\nDate: {invoice.Date.ToShortDateString()}\n\nItems:\n{itemsHtml}\n\nTotal Amount: Rs. {invoice.TotalAmount}\n\nBest Regards,\nVehicle Inventory Staff";

        await _emailService.SendEmailAsync(customer.Email, $"Your Invoice #{invoice.Id}", body);

        return Ok("Invoice emailed successfully.");
    }

    // F12: Get full history for dashboard
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
