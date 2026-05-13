using System.ComponentModel.DataAnnotations;

namespace VehicleInventorySystem.Api.DTOs.Request;

public class AddVehicleRequest
{
    [Required]
    [StringLength(20)]
    public string PlateNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Model { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Make { get; set; } = string.Empty;

    [Required]
    [Range(1900, 2100)]
    public int Year { get; set; }

    [Required]
    [StringLength(30)]
    public string? FuelType { get; set; } // Petrol, Diesel, Hybrid, Electric, Other

    [Range(0, 1000000)]
    public int Mileage { get; set; } = 0; // in kilometers
}
