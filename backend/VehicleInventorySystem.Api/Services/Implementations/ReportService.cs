using System.Globalization;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Services.Implementations;

public class ReportService : IReportService
{
    private const string InvalidDateRangeMessage = "Please select a valid date range.";
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;

    public ReportService(AppDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<RevenueReportResponse> GetRevenueReportAsync(ReportQueryRequest request)
    {
        var range = BuildDateRange(request);
        var query = ApplyInvoiceDateRange(_context.Invoices
            .AsNoTracking()
            .Where(i => i.Type == InvoiceType.Sale), range);

        var count = await query.CountAsync();
        var revenue = await query.SumAsync(i => (decimal?)i.TotalAmount) ?? 0m;

        Console.WriteLine($"Period: {range.Period}, Start: {range.Start:o}, End: {range.End:o}, Count: {count}, Revenue: {revenue}");

        return new RevenueReportResponse
        {
            Period = range.Period,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Revenue = revenue,
            Count = count
        };
    }

    public async Task<List<CustomerSummaryReportResponse>> GetCustomerSummaryAsync(ReportQueryRequest request)
    {
        var range = BuildDateRange(request);
        var query = ApplyInvoiceDateRange(_context.Invoices
            .AsNoTracking()
            .Where(i => i.Type == InvoiceType.Sale && i.CustomerId.HasValue), range);

        var groupedQuery = query
            .GroupBy(i => i.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                TotalSpent = g.Sum(i => i.TotalAmount),
                PurchaseCount = g.Count(),
                OrderCount = g.Count(),
                LastVisit = g.Max(i => i.Date)
            });

        return await groupedQuery
            .OrderByDescending(x => x.TotalSpent)
            .Join(_context.Users.AsNoTracking(),
                r => r.CustomerId,
                u => (int?)u.Id,
                (r, u) => new CustomerSummaryReportResponse
                {
                    CustomerId = r.CustomerId,
                    CustomerName = u.Name,
                    CustomerPhone = u.PhoneNumber,
                    EmailAddress = u.Email,
                    TotalSpent = r.TotalSpent,
                    PurchaseCount = r.PurchaseCount,
                    OrderCount = r.OrderCount,
                    LastVisit = r.LastVisit
                })
            .ToListAsync();
    }

    public async Task<List<CustomerSpendingReportResponse>> GetHighSpendersAsync(ReportQueryRequest request)
    {
        var range = BuildDateRange(request);
        var query = ApplyInvoiceDateRange(_context.Invoices
            .AsNoTracking()
            .Where(i => i.Type == InvoiceType.Sale && i.CustomerId.HasValue), range);

        var groupedQuery = query
            .GroupBy(i => i.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                TotalSpent = g.Sum(i => i.TotalAmount),
                PurchaseCount = g.Count(),
                OrderCount = g.Count(),
                LastVisit = g.Max(i => i.Date)
            });

        return await groupedQuery
            .OrderByDescending(x => x.TotalSpent)
            .Take(5)
            .Join(_context.Users.AsNoTracking(),
                r => r.CustomerId,
                u => (int?)u.Id,
                (r, u) => new CustomerSpendingReportResponse
                {
                    CustomerId = r.CustomerId,
                    CustomerName = u.Name,
                    CustomerPhone = u.PhoneNumber,
                    TotalSpent = r.TotalSpent,
                    PurchaseCount = r.PurchaseCount,
                    OrderCount = r.OrderCount,
                    LastVisit = r.LastVisit
                })
            .ToListAsync();
    }

    public async Task<List<RegularCustomerReportResponse>> GetRegularCustomersAsync(ReportQueryRequest request)
    {
        var range = BuildDateRange(request);
        var query = ApplyInvoiceDateRange(_context.Invoices
            .AsNoTracking()
            .Where(i => i.Type == InvoiceType.Sale && i.CustomerId.HasValue), range);

        var groupedQuery = query
            .GroupBy(i => i.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                VisitCount = g.Count(),
                AvgSpend = g.Average(i => i.TotalAmount),
                LastVisit = g.Max(i => i.Date)
            });

        return await groupedQuery
            .OrderByDescending(x => x.VisitCount)
            .Take(5)
            .Join(_context.Users.AsNoTracking(),
                r => r.CustomerId,
                u => (int?)u.Id,
                (r, u) => new RegularCustomerReportResponse
                {
                    CustomerId = r.CustomerId,
                    CustomerName = u.Name,
                    CustomerPhone = u.PhoneNumber,
                    VisitCount = r.VisitCount,
                    AvgSpend = r.AvgSpend,
                    LastVisit = r.LastVisit
                })
            .ToListAsync();
    }

    public async Task<List<PendingCreditReportResponse>> GetPendingCreditsAsync(ReportQueryRequest request)
    {
        var range = BuildDateRange(request);
        var query = ApplyInvoiceDateRange(_context.Invoices
            .AsNoTracking()
            .Where(i => i.Type == InvoiceType.Sale &&
                i.CustomerId.HasValue &&
                (i.PaymentStatus == "half-payment" || i.PaymentStatus == "partial-payment")), range);

        var groupedQuery = query
            .GroupBy(i => i.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                TotalPending = g.Sum(i => i.TotalAmount),
                UnpaidInvoiceCount = g.Count(),
                OldestInvoiceDate = g.Min(i => i.Date)
            });

        return await groupedQuery
            .OrderByDescending(x => x.TotalPending)
            .Take(5)
            .Join(_context.Users.AsNoTracking(),
                r => r.CustomerId,
                u => (int?)u.Id,
                (r, u) => new PendingCreditReportResponse
                {
                    CustomerId = r.CustomerId,
                    CustomerName = u.Name,
                    CustomerPhone = u.PhoneNumber,
                    TotalPending = r.TotalPending,
                    UnpaidInvoiceCount = r.UnpaidInvoiceCount,
                    OldestInvoiceDate = r.OldestInvoiceDate
                })
            .ToListAsync();
    }

    public async Task<SendReminderReportResponse> SendUnpaidRemindersAsync()
    {
        var oneMonthAgo = DateTime.UtcNow.AddMonths(-1);
        var unpaidInvoices = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.Type == InvoiceType.Sale && !i.IsPaid && i.Date < oneMonthAgo && i.CustomerId.HasValue)
            .Include(i => i.Items)
            .ToListAsync();

        var sentCount = 0;
        foreach (var invoice in unpaidInvoices)
        {
            var customer = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == invoice.CustomerId);
            if (customer == null || string.IsNullOrEmpty(customer.Email))
            {
                continue;
            }

            await _emailService.SendEmailAsync(
                customer.Email,
                "Action Required: Overdue Invoice Payment",
                BuildPaymentReminderEmail(customer.Name, invoice));
            sentCount++;
        }

        return new SendReminderReportResponse
        {
            Message = $"Sent {sentCount} email reminders for overdue invoices.",
            SentCount = sentCount
        };
    }

    private static ReportDateRange BuildDateRange(ReportQueryRequest request)
    {
        var period = string.IsNullOrWhiteSpace(request.Period)
            ? "daily"
            : request.Period.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;

        return period switch
        {
            "daily" => new ReportDateRange(period, now.Date, now.Date.AddDays(1), false),
            "monthly" => BuildMonthRange(now),
            "yearly" => BuildYearRange(now),
            "custom" => BuildCustomRange(request.StartDate, request.EndDate),
            _ => new ReportDateRange("daily", now.Date, now.Date.AddDays(1), false)
        };
    }

    private static ReportDateRange BuildMonthRange(DateTime now)
    {
        var start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        return new ReportDateRange("monthly", start, start.AddMonths(1), false);
    }

    private static ReportDateRange BuildYearRange(DateTime now)
    {
        var start = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        return new ReportDateRange("yearly", start, start.AddYears(1), false);
    }

    private static ReportDateRange BuildCustomRange(string? startDate, string? endDate)
    {
        if (!TryParseReportDate(startDate, out var parsedStart) ||
            !TryParseReportDate(endDate, out var parsedEnd))
        {
            throw new ArgumentException(InvalidDateRangeMessage);
        }

        var start = DateTime.SpecifyKind(parsedStart.Date, DateTimeKind.Utc);
        var end = DateTime.SpecifyKind(parsedEnd.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
        if (end < start)
        {
            throw new ArgumentException(InvalidDateRangeMessage);
        }

        return new ReportDateRange("custom", start, end, true);
    }

    private static bool TryParseReportDate(string? value, out DateTime date)
    {
        return DateTime.TryParseExact(
            value,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out date);
    }

    private static IQueryable<Invoice> ApplyInvoiceDateRange(IQueryable<Invoice> query, ReportDateRange range)
    {
        return range.IncludeEnd
            ? query.Where(i => i.Date >= range.Start && i.Date <= range.End)
            : query.Where(i => i.Date >= range.Start && i.Date < range.End);
    }

    private static string BuildPaymentReminderEmail(string customerName, Invoice invoice)
    {
        return $@"
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
      <p style='margin:0 0 16px'>Dear <strong>{customerName}</strong>,</p>
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
    }

    private sealed record ReportDateRange(string Period, DateTime Start, DateTime End, bool IncludeEnd);
}
