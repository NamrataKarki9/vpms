using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("revenue")]
    public async Task<ActionResult> GetRevenueReport(
        [FromQuery] string period = "daily",
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null)
    {
        return await ExecuteReportAsync(() =>
            _reportService.GetRevenueReportAsync(BuildReportQuery(period, startDate, endDate)));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("customers")]
    public async Task<ActionResult> GetCustomerSummary(
        [FromQuery] string period = "daily",
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null)
    {
        return await ExecuteReportAsync(() =>
            _reportService.GetCustomerSummaryAsync(BuildReportQuery(period, startDate, endDate)));
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("customers/high-spenders")]
    public async Task<ActionResult> GetHighSpenders(
        [FromQuery] string period = "daily",
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null)
    {
        return await ExecuteReportAsync(() =>
            _reportService.GetHighSpendersAsync(BuildReportQuery(period, startDate, endDate)));
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("customers/regulars")]
    public async Task<ActionResult> GetRegularCustomers(
        [FromQuery] string period = "daily",
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null)
    {
        return await ExecuteReportAsync(() =>
            _reportService.GetRegularCustomersAsync(BuildReportQuery(period, startDate, endDate)));
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("customers/pending-credits")]
    public async Task<ActionResult> GetPendingCredits(
        [FromQuery] string period = "daily",
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null)
    {
        return await ExecuteReportAsync(() =>
            _reportService.GetPendingCreditsAsync(BuildReportQuery(period, startDate, endDate)));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("send-unpaid-reminders")]
    public async Task<ActionResult> SendUnpaidReminders()
    {
        return Ok(await _reportService.SendUnpaidRemindersAsync());
    }

    private static ReportQueryRequest BuildReportQuery(string period, string? startDate, string? endDate)
    {
        return new ReportQueryRequest
        {
            Period = period,
            StartDate = startDate,
            EndDate = endDate
        };
    }

    private async Task<ActionResult> ExecuteReportAsync<TResponse>(Func<Task<TResponse>> action)
    {
        try
        {
            return Ok(await action());
        }
        catch (ArgumentException error)
        {
            return BadRequest(new { message = error.Message });
        }
    }
}
