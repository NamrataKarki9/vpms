namespace VehicleInventorySystem.Api.DTOs.Request;

public class ReportQueryRequest : PaginationRequest
{
    public string Period { get; set; } = "daily";
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
}
