namespace VehicleInventorySystem.Api.DTOs.Response;

public class VehicleResponse
{
    public int Id { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? FuelType { get; set; }
    public int Mileage { get; set; }
}
