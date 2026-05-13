using System.Text.Json.Serialization;

namespace VehicleInventorySystem.Api.Models;

public enum RequestUrgency
{
    Low,
    Medium,
    High
}

public enum RequestStatus
{
    Pending,
    Approved,
    Rejected,
    Fulfilled
}

public class SpecialPartRequest
{
    public int Id { get; set; }

    [JsonPropertyName("customerId")]
    public int CustomerId { get; set; }

    [JsonPropertyName("vehicleId")]
    public int VehicleId { get; set; }

    [JsonPropertyName("partId")]
    public int? PartId { get; set; }

    [JsonPropertyName("customPartName")]
    public string? CustomPartName { get; set; }

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }

    [JsonPropertyName("urgency")]
    public RequestUrgency Urgency { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("status")]
    public RequestStatus Status { get; set; } = RequestStatus.Pending;

    [JsonPropertyName("requestedAt")]
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public User? Customer { get; set; }
    public Vehicle? Vehicle { get; set; }
    public Part? Part { get; set; }
}
