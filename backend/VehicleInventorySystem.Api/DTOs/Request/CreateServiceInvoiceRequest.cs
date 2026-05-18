using System.Text.Json.Serialization;

namespace VehicleInventorySystem.Api.DTOs.Request;

public class CreateServiceInvoiceRequest
{
    [JsonPropertyName("customerId")]
    public int CustomerId { get; set; }

    [JsonPropertyName("vehicleId")]
    public int VehicleId { get; set; }

    [JsonPropertyName("serviceType")]
    public string ServiceType { get; set; } = string.Empty;

    [JsonPropertyName("serviceDate")]
    public DateTime ServiceDate { get; set; }

    [JsonPropertyName("mileage")]
    public int Mileage { get; set; } = 0;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("mechanicNotes")]
    public string? MechanicNotes { get; set; }

    [JsonPropertyName("serviceCharge")]
    public decimal ServiceCharge { get; set; }

    [JsonPropertyName("paymentStatus")]
    public string PaymentStatus { get; set; } = string.Empty;
}
