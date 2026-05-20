using System.ComponentModel.DataAnnotations;

namespace VehicleInventorySystem.Api.DTOs.Request;

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Current password is required")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 100 characters")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};:'"",.<>?/\\|`~]).*$",
        ErrorMessage = "Password must contain at least one uppercase letter, one number, and one special character")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password confirmation is required")]
    [Compare("NewPassword", ErrorMessage = "The new password and confirmation password do not match")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
