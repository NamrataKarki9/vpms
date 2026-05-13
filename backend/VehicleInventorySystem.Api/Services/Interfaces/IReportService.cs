using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;

namespace VehicleInventorySystem.Api.Services.Interfaces;

public interface IReportService
{
    Task<RevenueReportResponse> GetRevenueReportAsync(ReportQueryRequest request);
    Task<PaginatedResponse<CustomerSummaryReportResponse>> GetCustomerSummaryAsync(ReportQueryRequest request);
    Task<PaginatedResponse<CustomerSpendingReportResponse>> GetHighSpendersAsync(ReportQueryRequest request);
    Task<PaginatedResponse<RegularCustomerReportResponse>> GetRegularCustomersAsync(ReportQueryRequest request);
    Task<PaginatedResponse<PendingCreditReportResponse>> GetPendingCreditsAsync(ReportQueryRequest request);
    Task<SendReminderReportResponse> SendUnpaidRemindersAsync();
    Task<SendReminderReportResponse> SendCustomerReminderAsync(int customerId);
}
