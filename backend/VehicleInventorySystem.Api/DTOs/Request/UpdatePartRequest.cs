using System.ComponentModel.DataAnnotations;

namespace VehicleInventorySystem.Api.DTOs.Request;
public class UpdatePartRequest
{
    public string Name { get; set; } = string.Empty;

    public string PartCode { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public int StockLevel { get; set; }

    public int VendorId { get; set; }

    public bool IsActive { get; set; }
}