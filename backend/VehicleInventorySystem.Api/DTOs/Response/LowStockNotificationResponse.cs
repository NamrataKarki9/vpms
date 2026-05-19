namespace VehicleInventorySystem.Api.DTOs.Response;

public class LowStockNotificationResponse
{
    public int PartId { get; set; }

    public string PartName { get; set; } = string.Empty;

    public string PartCode { get; set; } = string.Empty;

    public int CurrentStock { get; set; }

    public string Message { get; set; } = string.Empty;
}