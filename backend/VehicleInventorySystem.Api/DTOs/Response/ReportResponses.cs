namespace VehicleInventorySystem.Api.DTOs.Response;

public class RevenueReportResponse
{
    public string Period { get; set; } = "daily";
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public decimal Revenue { get; set; }
    public int Count { get; set; }
}

public class CustomerSummaryReportResponse
{
    public int? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? EmailAddress { get; set; }
    public decimal TotalSpent { get; set; }
    public int PurchaseCount { get; set; }
    public int OrderCount { get; set; }
    public DateTime LastVisit { get; set; }
}

public class CustomerSpendingReportResponse
{
    public int? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public decimal TotalSpent { get; set; }
    public int PurchaseCount { get; set; }
    public int OrderCount { get; set; }
    public DateTime LastVisit { get; set; }
}

public class RegularCustomerReportResponse
{
    public int? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public int VisitCount { get; set; }
    public decimal AvgSpend { get; set; }
    public DateTime LastVisit { get; set; }
}

public class PendingCreditReportResponse
{
    public int? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public decimal TotalPending { get; set; }
    public int UnpaidInvoiceCount { get; set; }
    public DateTime OldestInvoiceDate { get; set; }
}

public class SendReminderReportResponse
{
    public string Message { get; set; } = string.Empty;
    public int SentCount { get; set; }
}
