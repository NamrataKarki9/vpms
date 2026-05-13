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
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;

    public ReportsController(AppDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    // F1: Admin - Financial reports (daily, monthly, yearly)
    [Authorize(Roles = "Admin")]
    [HttpGet("revenue")]
    public async Task<ActionResult> GetRevenueReport([FromQuery] string period = "daily")
    {
        var now = DateTime.UtcNow;
        var query = _context.Invoices.Where(i => i.Type == InvoiceType.Sale);

        if (period == "daily") query = query.Where(i => i.Date >= now.Date);
        else if (period == "monthly") query = query.Where(i => i.Date >= new DateTime(now.Year, now.Month, 1));
        else if (period == "yearly") query = query.Where(i => i.Date >= new DateTime(now.Year, 1, 1));

        var total = await query
            .Select(i => i.PaymentStatus == "half-payment" ? i.TotalAmount * 0.5m :
                         i.PaymentStatus == "partial-payment" ? i.TotalAmount * 0.1m :
                         i.TotalAmount)
            .SumAsync();
        var count = await query.CountAsync();

        return Ok(new { Period = period, TotalRevenue = total, InvoiceCount = count });
    }

    // F9: Staff - Customer reports (regulars, high spenders)
    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("customers/high-spenders")]
    public async Task<ActionResult> GetHighSpenders()
    {
        var highSpenders = await _context.Invoices
            .Where(i => i.Type == InvoiceType.Sale && i.CustomerId.HasValue)
            .GroupBy(i => i.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                TotalSpent = g.Sum(i => i.TotalAmount),
                PurchaseCount = g.Count()
            })
            .OrderByDescending(x => x.TotalSpent)
            .Take(5)
            .Join(_context.Users,
                r => r.CustomerId,
                u => (int?)u.Id,
                (r, u) => new
                {
                    r.CustomerId,
                    CustomerName = u.Name,
                    CustomerPhone = u.PhoneNumber,
                    r.TotalSpent,
                    r.PurchaseCount
                })
            .ToListAsync();

        return Ok(highSpenders);
    }

    // F9: Staff - Regular customers (Frequent visits)
    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("customers/regulars")]
    public async Task<ActionResult> GetRegularCustomers()
    {
        var regulars = await _context.Invoices
            .Where(i => i.Type == InvoiceType.Sale && i.CustomerId.HasValue)
            .GroupBy(i => i.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                VisitCount = g.Count()
            })
            .OrderByDescending(x => x.VisitCount)
            .Take(5)
            .Join(_context.Users,
                r => r.CustomerId,
                u => (int?)u.Id,
                (r, u) => new
                {
                    r.CustomerId,
                    CustomerName = u.Name,
                    CustomerPhone = u.PhoneNumber,
                    r.VisitCount
                })
            .ToListAsync();

        return Ok(regulars);
    }

    // F9: Staff - Pending credit reports (Customers with unpaid balances)
    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("customers/pending-credits")]
    public async Task<ActionResult> GetPendingCredits()
    {
        var pendingCredits = await _context.Invoices
            .Where(i => i.Type == InvoiceType.Sale && i.CustomerId.HasValue &&
                (i.PaymentStatus == "half-payment" || i.PaymentStatus == "partial-payment"))
            .GroupBy(i => i.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                TotalPending = g.Sum(i => i.TotalAmount),
                UnpaidInvoiceCount = g.Count()
            })
            .OrderByDescending(x => x.TotalPending)
            .Take(5)
            .Join(_context.Users,
                r => r.CustomerId,
                u => (int?)u.Id,
                (r, u) => new
                {
                    r.CustomerId,
                    CustomerName = u.Name,
                    CustomerPhone = u.PhoneNumber,
                    r.TotalPending,
                    r.UnpaidInvoiceCount
                })
            .ToListAsync();

        return Ok(pendingCredits);
    }

    // F15: System notification for unpaid credits (Email reminders older than 1 month)
    [Authorize(Roles = "Admin")]
    [HttpPost("send-unpaid-reminders")]
    public async Task<ActionResult> SendUnpaidReminders()
    {
        var oneMonthAgo = DateTime.UtcNow.AddMonths(-1);
        
        var unpaidInvoices = await _context.Invoices
            .Where(i => i.Type == InvoiceType.Sale && !i.IsPaid && i.Date < oneMonthAgo && i.CustomerId.HasValue)
            .Include(i => i.Items)
            .ToListAsync();

        int sentCount = 0;
        foreach (var invoice in unpaidInvoices)
        {
            var customer = await _context.Users.FindAsync(invoice.CustomerId);
            if (customer != null && !string.IsNullOrEmpty(customer.Email))
            {
                string subject = "Action Required: Overdue Invoice Payment";
                string body = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='margin:0;padding:0;font-family:Arial,sans-serif;background:#f1f5f9'>
  <table style='max-width:600px;margin:auto;margin-top:24px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0'>
    <tr><td style='background:#e11d48;padding:24px;text-align:center;color:#fff'>
      <h1 style='margin:0;font-size:20px'>Payment Reminder</h1>
      <p style='margin:8px 0 0;opacity:0.8'>Overdue Invoice #{invoice.Id}</p>
    </td></tr>
    <tr><td style='padding:24px'>
      <p style='margin:0 0 16px'>Dear <strong>{customer.Name}</strong>,</p>
      <p style='margin:0 0 16px;color:#475569;line-height:1.5'>
        This is a reminder that your invoice <strong>#{invoice.Id}</strong> dated <strong>{invoice.Date.ToShortDateString()}</strong> 
        for the amount of <strong>Rs. {invoice.TotalAmount:N2}</strong> is overdue by more than a month.
      </p>
      <p style='margin:0 0 24px;color:#475569;line-height:1.5'>
        Please arrange for payment as soon as possible to avoid any interruption of services.
      </p>
      <div style='background:#fff1f2;padding:16px;border-radius:8px;border:1px solid #fecdd3;color:#9f1239;text-align:center;font-weight:600'>
        Outstanding Balance: Rs. {invoice.TotalAmount:N2}
      </div>
      <p style='margin-top:32px;font-size:13px;color:#64748b;text-align:center'>
        <strong>Vehicle Inventory System</strong><br>
        If you have already made the payment, please ignore this email.
      </p>
    </td></tr>
  </table>
</body>
</html>";
                
                await _emailService.SendEmailAsync(customer.Email, subject, body);
                sentCount++;
            }
        }

        return Ok(new { Message = $"Sent {sentCount} email reminders for overdue invoices." });
    }
}
