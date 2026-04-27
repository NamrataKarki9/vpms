namespace VehicleInventorySystem.Api.Models;

public class Part
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PartCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockLevel { get; set; }
    
    public int VendorId { get; set; }
    public Vendor? Vendor { get; set; }
}
