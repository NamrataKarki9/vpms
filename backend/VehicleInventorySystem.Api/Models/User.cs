namespace VehicleInventorySystem.Api.Models;

public enum UserRole
{
    Admin,
    Staff,
    Customer
}

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Optional navigation properties
    public ICollection<Vehicle>? Vehicles { get; set; }
}
