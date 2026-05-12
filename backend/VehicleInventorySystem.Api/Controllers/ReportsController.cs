using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.Models;

using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
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
                string body = $"Dear {customer.Name},\n\nThis is a reminder that your invoice #{invoice.Id} dated {invoice.Date.ToShortDateString()} for the amount of Rs. {invoice.TotalAmount} is overdue by more than a month.\n\nPlease arrange for payment as soon as possible to avoid interruption of services.\n\nThank you,\nVehicle Inventory System";
                
                await _emailService.SendEmailAsync(customer.Email, subject, body);
                sentCount++;
            }
        }

        return Ok(new { Message = $"Sent {sentCount} email reminders for overdue invoices." });
    }
}
