using System.ComponentModel.DataAnnotations;

namespace VehicleInventorySystem.Api.DTOs.Request;

public class VehicleDto
{
    public string? PlateNumber { get; set; }
    public string? Model { get; set; }
    public string? Make { get; set; }
    public int Year { get; set; }
}
