namespace VehicleInventorySystem.Api.Models;

public class Vehicle
{
    public int Id { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? FuelType { get; set; } // Petrol, Diesel, Hybrid, Electric, etc.
    public int Mileage { get; set; } = 0; // in kilometers
    public DateTime? DeletedAt { get; set; } // Soft delete timestamp
    
    public int CustomerId { get; set; }
    public User? Customer { get; set; }
}

public enum InvoiceType
{
    Purchase, // From Vendor
    Sale      // To Customer
}

public class Invoice
{
    public int Id { get; set; }
    public InvoiceType Type { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public decimal TotalAmount { get; set; }
    public bool IsPaid { get; set; } = true;
    public string? PaymentStatus { get; set; } // full-payment, half-payment, partial-payment
    
    // For Sale: Staff Id and Customer Id
    // For Purchase: Vendor Id
    public int? CreatedById { get; set; } // Staff Id
    public int? CustomerId { get; set; }
    public User? Customer { get; set; }
    public int? VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }
    public int? VendorId { get; set; }
    public Vendor? Vendor { get; set; }
    
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}

public class InvoiceItem
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public int PartId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    
    public Part? Part { get; set; }
}
