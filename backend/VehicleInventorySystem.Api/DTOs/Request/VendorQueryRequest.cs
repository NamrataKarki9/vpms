namespace VehicleInventorySystem.Api.DTOs.Request;

public class VendorQueryRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 5;
    public string? SearchTerm { get; set; }
    public string? Status { get; set; } = "all";
}
