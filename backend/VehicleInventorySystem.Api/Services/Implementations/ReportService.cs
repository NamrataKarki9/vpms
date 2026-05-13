using System.Globalization;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.Services.Interfaces;
using VehicleInventorySystem.Api.Extensions;

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

    public async Task<PaginatedResponse<CustomerSummaryReportResponse>> GetCustomerSummaryAsync(ReportQueryRequest request)
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
            })
            .OrderByDescending(x => x.TotalSpent);

        var pagedData = await groupedQuery.ToPaginatedResponseAsync(request.PageNumber, request.PageSize);

        var items = pagedData.Items
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
            .ToList();

        return new PaginatedResponse<CustomerSummaryReportResponse>
        {
            Items = items,
            PageNumber = pagedData.PageNumber,
            PageSize = pagedData.PageSize,
            TotalItems = pagedData.TotalItems,
            TotalPages = pagedData.TotalPages,
            HasNextPage = pagedData.HasNextPage,
            HasPreviousPage = pagedData.HasPreviousPage
        };
    }

    public async Task<PaginatedResponse<CustomerSpendingReportResponse>> GetHighSpendersAsync(ReportQueryRequest request)
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
            })
            .OrderByDescending(x => x.TotalSpent);

        var pagedData = await groupedQuery.ToPaginatedResponseAsync(request.PageNumber, request.PageSize);

        var items = pagedData.Items
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
            .ToList();

        return new PaginatedResponse<CustomerSpendingReportResponse>
        {
            Items = items,
            PageNumber = pagedData.PageNumber,
            PageSize = pagedData.PageSize,
            TotalItems = pagedData.TotalItems,
            TotalPages = pagedData.TotalPages,
            HasNextPage = pagedData.HasNextPage,
            HasPreviousPage = pagedData.HasPreviousPage
        };
    }

    public async Task<PaginatedResponse<RegularCustomerReportResponse>> GetRegularCustomersAsync(ReportQueryRequest request)
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
            })
            .OrderByDescending(x => x.VisitCount);

        var pagedData = await groupedQuery.ToPaginatedResponseAsync(request.PageNumber, request.PageSize);

        var items = pagedData.Items
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
            .ToList();

        return new PaginatedResponse<RegularCustomerReportResponse>
        {
            Items = items,
            PageNumber = pagedData.PageNumber,
            PageSize = pagedData.PageSize,
            TotalItems = pagedData.TotalItems,
            TotalPages = pagedData.TotalPages,
            HasNextPage = pagedData.HasNextPage,
            HasPreviousPage = pagedData.HasPreviousPage
        };
    }

    public async Task<PaginatedResponse<PendingCreditReportResponse>> GetPendingCreditsAsync(ReportQueryRequest request)
    {
        var range = BuildDateRange(request);
        var query = ApplyInvoiceDateRange(_context.Invoices
            .AsNoTracking()
            .Where(i => i.Type == InvoiceType.Sale &&
                i.CustomerId.HasValue &&
                !i.IsPaid), range);

        var groupedQuery = query
            .GroupBy(i => i.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                TotalPending = g.Sum(i => i.TotalAmount),
                UnpaidInvoiceCount = g.Count(),
                OldestInvoiceDate = g.Min(i => i.Date)
            })
            .OrderByDescending(x => x.TotalPending);

        var pagedData = await groupedQuery.ToPaginatedResponseAsync(request.PageNumber, request.PageSize);

        var items = pagedData.Items
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
            .ToList();

        return new PaginatedResponse<PendingCreditReportResponse>
        {
            Items = items,
            PageNumber = pagedData.PageNumber,
            PageSize = pagedData.PageSize,
            TotalItems = pagedData.TotalItems,
            TotalPages = pagedData.TotalPages,
            HasNextPage = pagedData.HasNextPage,
            HasPreviousPage = pagedData.HasPreviousPage
        };
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
                BuildPremiumPaymentReminderEmail(customer.Name, invoice.TotalAmount, new List<Invoice> { invoice }));
            sentCount++;
        }

        return new SendReminderReportResponse
        {
            Message = $"Sent {sentCount} email reminders for overdue invoices.",
            SentCount = sentCount
        };
    }

    public async Task<SendReminderReportResponse> SendCustomerReminderAsync(int customerId)
    {
        var customer = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == customerId);
        if (customer == null)
        {
            throw new ArgumentException("Customer not found.");
        }

        if (string.IsNullOrEmpty(customer.Email))
        {
            throw new ArgumentException("Customer has no email address configured.");
        }

        var unpaidInvoices = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.Type == InvoiceType.Sale && !i.IsPaid && i.CustomerId == customerId)
            .OrderByDescending(i => i.Date)
            .ToListAsync();

        if (!unpaidInvoices.Any())
        {
            return new SendReminderReportResponse
            {
                Message = "No unpaid invoices found for this customer.",
                SentCount = 0
            };
        }

        var totalPending = unpaidInvoices.Sum(i => i.TotalAmount);

        await _emailService.SendEmailAsync(
            customer.Email,
            "Urgent: Payment Reminder for Your Outstanding Balance",
            BuildPremiumPaymentReminderEmail(customer.Name, totalPending, unpaidInvoices));

        return new SendReminderReportResponse
        {
            Message = $"Payment reminder sent successfully to {customer.Name}.",
            SentCount = 1
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

    private static string BuildPremiumPaymentReminderEmail(string customerName, decimal totalAmount, List<Invoice> invoices)
    {
        var invoiceDetails = string.Join("", invoices.Select(i => $@"
            <div style='display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #edf2f7;'>
                <span style='color:#4a5568;'>Invoice #{i.Id} ({i.Date:yyyy-MM-dd})</span>
                <span style='font-weight:600; color:#2d3748;'>Rs. {i.TotalAmount:N2}</span>
            </div>"));

        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='margin:0; padding:0; font-family:""Inter"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; background-color:#f4f7fa; color:#2d3748;'>
    <div style='max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.05); border:1px solid #e2e8f0;'>
        <!-- Header with Navy Gradient -->
        <div style='background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding:40px 20px; text-align:center;'>
            <div style='width:50px; height:50px; background:linear-gradient(135deg, #3b82f6, #60a5fa); border-radius:12px; margin:0 auto 20px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:24px; font-weight:800; box-shadow:0 8px 16px rgba(59, 130, 246, 0.3);'>
                V
            </div>
            <h1 style='margin:0; font-size:24px; font-weight:700; color:#ffffff; letter-spacing:-0.02em;'>Payment Reminder</h1>
            <p style='margin:10px 0 0; color:rgba(255,255,255,0.7); font-size:16px;'>Vehicle Inventory & Service Management</p>
        </div>

        <!-- Content Area -->
        <div style='padding:40px 32px;'>
            <p style='margin:0 0 20px; font-size:18px; font-weight:600; color:#1a202c;'>Hello {customerName},</p>
            <p style='margin:0 0 24px; font-size:16px; line-height:1.6; color:#4a5568;'>
                We hope you're doing well. This is a friendly reminder regarding your outstanding balance with our service center. 
                Our records show that the following payment(s) are currently pending:
            </p>

            <!-- Invoice Summary Card -->
            <div style='background-color:#f8fafc; border-radius:12px; padding:24px; border:1px solid #e2e8f0; margin-bottom:32px;'>
                <div style='font-size:13px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:15px;'>Pending Invoices</div>
                {invoiceDetails}
                <div style='display:flex; justify-content:space-between; padding-top:15px; margin-top:5px;'>
                    <span style='font-size:16px; font-weight:700; color:#1e293b;'>Total Outstanding</span>
                    <span style='font-size:18px; font-weight:800; color:#2563eb;'>Rs. {totalAmount:N2}</span>
                </div>
            </div>

            <p style='margin:0 0 32px; font-size:15px; line-height:1.6; color:#4a5568;'>
                Please arrange for the payment at your earliest convenience. You can visit our service center or contact us for online payment options. 
                If you have already made the payment, please ignore this email.
            </p>

            <!-- Action Button -->
            <div style='text-align:center; margin-bottom:40px;'>
                <a href='#' style='background-color:#2563eb; color:#ffffff; padding:16px 32px; border-radius:10px; text-decoration:none; font-weight:700; font-size:16px; display:inline-block; transition:all 0.2s;'>
                    Contact Support
                </a>
            </div>

            <hr style='border:0; border-top:1px solid #e2e8f0; margin-bottom:30px;'>

            <!-- Footer -->
            <div style='text-align:center; color:#94a3b8; font-size:13px;'>
                <p style='margin:0 0 8px;'><strong>Vehicle Management System</strong></p>
                <p style='margin:0;'>123 Service Street, Automotive Plaza</p>
                <p style='margin:4px 0 0;'>Phone: +1 (555) 000-1234</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private sealed record ReportDateRange(string Period, DateTime Start, DateTime End, bool IncludeEnd);
}
