namespace VehicleInventorySystem.Api.DTOs.Response;

public class NotificationResponse
{
    public int Id { get; set; }

    public string NotificationKey { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public int? UserId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }
}