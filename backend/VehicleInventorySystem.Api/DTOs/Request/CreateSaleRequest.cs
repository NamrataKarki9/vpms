using System.ComponentModel.DataAnnotations;

namespace VehicleInventorySystem.Api.DTOs.Request;

public class CreateSaleRequest
{
    [Required(ErrorMessage = "Customer is required.")]
    public int CustomerId { get; set; }

    public int? VehicleId { get; set; } // Optional - parts not tied to specific vehicle

    [Required(ErrorMessage = "At least one sale item is required.")]
    [MinLength(1, ErrorMessage = "At least one sale item is required.")]
    public List<SaleItemRequest> Items { get; set; } = new();

    [Required(ErrorMessage = "Total amount is required.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Total amount must be greater than zero.")]
    public decimal TotalAmount { get; set; }

    public string? PaymentStatus { get; set; } // full-payment, half-payment, partial-payment
}

public class SaleItemRequest
{
    [Required(ErrorMessage = "Part ID is required.")]
    public int PartId { get; set; }

    [Required(ErrorMessage = "Quantity is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
    public int Quantity { get; set; }

    [Required(ErrorMessage = "Unit price is required.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than zero.")]
    public decimal UnitPrice { get; set; }
}
