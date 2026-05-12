using System.ComponentModel.DataAnnotations;

namespace VehicleInventorySystem.Api.DTOs.Request;

public class VehicleDto
{
    public string? PlateNumber { get; set; }
    public string? Model { get; set; }
    public string? Make { get; set; }
    public int Year { get; set; }
    public string? FuelType { get; set; } // Petrol, Diesel, Hybrid, Electric
    public int Mileage { get; set; } = 0; // in kilometers
}
