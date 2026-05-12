using Microsoft.AspNetCore.Identity;

namespace VehicleInventorySystem.Api.Models;

public enum UserRole
{
    Admin,
    Staff,
    Customer
}

public class User : IdentityUser<int>
{
    public override string? Email { get; set; }
    public override string? PasswordHash { get; set; }

    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? ResetOtp { get; set; }
    public DateTime? ResetOtpExpiry { get; set; }

    public ICollection<Vehicle>? Vehicles { get; set; }
}
