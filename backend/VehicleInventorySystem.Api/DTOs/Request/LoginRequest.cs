using System.ComponentModel.DataAnnotations;

namespace VehicleInventorySystem.Api.DTOs.Request;

public class LoginRequest
{
    [Required(ErrorMessage = "Email address is required.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = string.Empty;
}
