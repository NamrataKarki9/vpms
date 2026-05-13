using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;

namespace VehicleInventorySystem.Api.Services.Interfaces;

public interface IReportService
{
    Task<RevenueReportResponse> GetRevenueReportAsync(ReportQueryRequest request);
    Task<List<CustomerSummaryReportResponse>> GetCustomerSummaryAsync(ReportQueryRequest request);
    Task<List<CustomerSpendingReportResponse>> GetHighSpendersAsync(ReportQueryRequest request);
    Task<List<RegularCustomerReportResponse>> GetRegularCustomersAsync(ReportQueryRequest request);
    Task<List<PendingCreditReportResponse>> GetPendingCreditsAsync(ReportQueryRequest request);
    Task<SendReminderReportResponse> SendUnpaidRemindersAsync();
}
