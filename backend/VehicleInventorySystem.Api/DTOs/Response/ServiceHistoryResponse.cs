namespace VehicleInventorySystem.Api.DTOs.Response;

public class ServiceHistoryResponse
{
    public int Id { get; set; }
    public DateTime ServiceDate { get; set; }
    public int VehicleId { get; set; }
    public string VehicleNumber { get; set; } = string.Empty;
    public string VehicleModel { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Cost { get; set; }
}
