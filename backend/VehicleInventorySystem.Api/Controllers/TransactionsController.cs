using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.Models;

using VehicleInventorySystem.Api.DTOs.Response;
using VehicleInventorySystem.Api.Services.Interfaces;
using System.Security.Claims;
using VehicleInventorySystem.Api.Extensions;
using VehicleInventorySystem.Api.DTOs.Response;

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
    public async Task<ActionResult<object>> CreateSale([FromBody] CreateSaleRequest request)
    {
        try
        {
            // Validate request
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { message = "Validation failed.", errors });
            }

            // Validate request is not null
            if (request == null)
                return BadRequest(new { message = "Request body is required." });

            if (request.Items == null || request.Items.Count == 0)
                return BadRequest(new { message = "At least one sale item is required." });

            if (request.CustomerId <= 0)
                return BadRequest(new { message = "Valid customer ID is required." });

            if (request.TotalAmount <= 0)
                return BadRequest(new { message = "Total amount must be greater than zero." });

            // Validate customer exists
            var customer = await _context.Users.FindAsync(request.CustomerId);
            if (customer == null)
                return BadRequest(new { message = "Customer not found." });

            // Validate vehicle if provided
            if (request.VehicleId.HasValue && request.VehicleId > 0)
            {
                var vehicle = await _context.Vehicles.FindAsync(request.VehicleId);
                if (vehicle == null)
                    return BadRequest(new { message = "Vehicle not found." });

                if (vehicle.CustomerId != request.CustomerId)
                    return BadRequest(new { message = "Vehicle does not belong to this customer." });
            }

            if (customer.Role != UserRole.Customer)
                return BadRequest(new { message = "Selected user is not a customer." });

            // Get current user (staff member creating the sale)
            var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(staffIdClaim, out int staffId))
                return Unauthorized(new { message = "Could not identify current user." });

            var staff = await _context.Users.FindAsync(staffId);
            if (staff == null)
                return Unauthorized(new { message = "Staff member not found." });

            // Validate all items and check stock BEFORE transaction
            var partIds = request.Items.Select(i => i.PartId).Distinct().ToList();
            var parts = await _context.Parts.Where(p => partIds.Contains(p.Id)).ToListAsync();

            foreach (var item in request.Items)
            {
                if (item.Quantity <= 0)
                    return BadRequest(new { message = "Quantity must be greater than zero." });

                if (item.UnitPrice <= 0)
                    return BadRequest(new { message = "Unit price must be greater than zero." });

                var part = parts.FirstOrDefault(p => p.Id == item.PartId);
                if (part == null)
                    return BadRequest(new { message = $"Part with ID {item.PartId} not found." });

                if (part.StockLevel < item.Quantity)
                    return BadRequest(new { message = $"Insufficient stock for {part.Name}. Available: {part.StockLevel}, Requested: {item.Quantity}" });
            }

            // All validation passed, now start transaction
            using var dbTransaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Create invoice
                var invoice = new Invoice
                {
                    Type = InvoiceType.Sale,
                    Date = DateTime.UtcNow,
                    CustomerId = request.CustomerId,
                    VehicleId = request.VehicleId,
                    CreatedById = staffId,
                    TotalAmount = request.TotalAmount,
                    PaymentStatus = request.PaymentStatus ?? "full-payment",
                    IsPaid = string.IsNullOrEmpty(request.PaymentStatus) || request.PaymentStatus == "full-payment"
                };

                // Add invoice to context FIRST (without items)
                _context.Invoices.Add(invoice);
                
                // Save to get the invoice ID
                await _context.SaveChangesAsync();

                Console.WriteLine($"[DEBUG] Invoice created with ID: {invoice.Id}");

                // Now add invoice items with the actual invoice ID
                foreach (var item in request.Items)
                {
                    var part = parts.First(p => p.Id == item.PartId);

                    var invoiceItem = new InvoiceItem
                    {
                        InvoiceId = invoice.Id,
                        PartId = item.PartId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice
                    };
                    
                    _context.InvoiceItems.Add(invoiceItem);
                    
                    // Decrease stock
                    part.StockLevel -= item.Quantity;

                    Console.WriteLine($"[DEBUG] Added item {item.PartId}, stock now: {part.StockLevel}");

                    // F15: System notification for low stock (< 10)
                    if (part.StockLevel < 10)
                    {
                        Console.WriteLine($"[LOW STOCK ALERT] Part: {part.Name} (Code: {part.PartCode}) - Remaining: {part.StockLevel} units");
                    }
                }

                // F16: Loyalty Program - 10% discount if spend > 5000
                decimal originalAmount = invoice.TotalAmount;
                if (invoice.TotalAmount > 5000)
                {
                    invoice.TotalAmount *= 0.9m; // Apply 10% discount
                    Console.WriteLine($"[DEBUG] Loyalty discount applied: {originalAmount} -> {invoice.TotalAmount}");
                }

                // Save items and stock updates
                await _context.SaveChangesAsync();
                await dbTransaction.CommitAsync();

                Console.WriteLine($"[DEBUG] Sale completed successfully. Invoice ID: {invoice.Id}");

                // Return success response
                return Ok(new
                {
                    id = invoice.Id,
                    customerId = invoice.CustomerId,
                    customerName = customer.Name,
                    totalAmount = invoice.TotalAmount,
                    date = invoice.Date.ToShortDateString(),
                    paymentStatus = invoice.PaymentStatus,
                    itemCount = request.Items.Count,
                    discountApplied = invoice.TotalAmount < originalAmount
                });
            }
            catch (DbUpdateException dbEx)
            {
                await dbTransaction.RollbackAsync();
                var innerMessage = dbEx.InnerException?.Message ?? dbEx.Message;
                Console.WriteLine($"[DB ERROR] {innerMessage}");
                Console.WriteLine($"[DB STACK] {dbEx.StackTrace}");
                return BadRequest(new { message = $"Database error: {innerMessage}" });
            }
            catch (Exception ex)
            {
                await dbTransaction.RollbackAsync();
                Console.WriteLine($"[TRANSACTION ERROR] {ex.Message}");
                Console.WriteLine($"[STACK] {ex.StackTrace}");
                return BadRequest(new { message = $"Transaction error: {ex.Message}" });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[UNHANDLED ERROR] {ex.Message}\n{ex.StackTrace}");
            return BadRequest(new { message = $"Error: {ex.Message}" });
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

    // F13: Get detailed sale invoices for staff/admin dashboard
    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("sales")]
    public async Task<ActionResult> GetSales([FromQuery] int? pageNumber, [FromQuery] int? pageSize)
    {
        var query = _context.Invoices.AsNoTracking()
            .Where(i => i.Type == InvoiceType.Sale)
            .Include(i => i.Customer)
            .Include(i => i.Items)
            .ThenInclude(ii => ii.Part)
            .OrderByDescending(i => i.Date);

        if (pageNumber.HasValue || pageSize.HasValue)
        {
            var pagedData = await query.ToPaginatedResponseAsync(pageNumber ?? 1, pageSize ?? 10);
            return Ok(new PaginatedResponse<object>
            {
                Items = pagedData.Items.Select(i => new
                {
                    i.Id,
                    CustomerName = i.Customer != null ? i.Customer.Name : "Walk-in",
                    CustomerEmail = i.Customer != null ? i.Customer.Email : "",
                    i.Date,
                    TotalAmount = i.TotalAmount,
                    PaymentStatus = i.PaymentStatus,
                    i.IsPaid,
                    Items = i.Items.Select(ii => new
                    {
                        PartName = ii.Part != null ? ii.Part.Name : "Unknown Part",
                        ii.Quantity,
                        ii.UnitPrice
                    })
                }).Cast<object>().ToList(),
                PageNumber = pagedData.PageNumber,
                PageSize = pagedData.PageSize,
                TotalItems = pagedData.TotalItems,
                TotalPages = pagedData.TotalPages,
                HasNextPage = pagedData.HasNextPage,
                HasPreviousPage = pagedData.HasPreviousPage
            });
        }

        var sales = await query
            .Select(i => new {
                i.Id,
                CustomerName = i.Customer != null ? i.Customer.Name : "Walk-in",
                CustomerEmail = i.Customer != null ? i.Customer.Email : "",
                i.Date,
                TotalAmount = i.TotalAmount,
                PaymentStatus = i.PaymentStatus,
                IsPaid = i.IsPaid,
                Items = i.Items.Select(ii => new {
                    PartName = ii.Part != null ? ii.Part.Name : "Unknown Part",
                    ii.Quantity,
                    ii.UnitPrice
                })
            })
            .ToListAsync();

        return Ok(sales);
    }

    // F14: Admin - Recent live transactions (sales + purchases)
    [Authorize(Roles = "Admin")]
    [HttpGet("recent")]
    public async Task<ActionResult<IEnumerable<object>>> GetRecentTransactions()
    {
        var query = _context.Invoices.AsQueryable();

        var recent = await query
            .Include(i => i.Customer)
            .Include(i => i.Vendor)
            .Include(i => i.Items)
            .ThenInclude(ii => ii.Part)
            .OrderByDescending(i => i.Date)
            .Take(20)
            .Select(i => new
            {
                invoiceId = i.Id,
                type = i.Type == InvoiceType.Sale ? "Sale" : "Purchase",
                date = i.Date,
                customerName = i.Type == InvoiceType.Sale ? (i.Customer != null ? i.Customer.Name : "Walk-in") : null,
                vendorName = i.Type == InvoiceType.Purchase ? (i.Vendor != null ? i.Vendor.Name : "Unknown Vendor") : null,
                totalAmount = i.TotalAmount,
                itemCount = i.Items.Count,
                isPaid = i.IsPaid,
                summary = i.Type == InvoiceType.Sale
                    ? $"Sale to {(i.Customer != null ? i.Customer.Name : "Walk-in")}" 
                    : $"Purchase from {(i.Vendor != null ? i.Vendor.Name : "Unknown Vendor")}"
            })
            .ToListAsync();

        return Ok(recent);
    }
}
