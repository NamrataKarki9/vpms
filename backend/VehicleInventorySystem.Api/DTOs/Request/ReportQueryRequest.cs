namespace VehicleInventorySystem.Api.DTOs.Request;

public class ReportQueryRequest
{
    public string Period { get; set; } = "daily";
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
}
