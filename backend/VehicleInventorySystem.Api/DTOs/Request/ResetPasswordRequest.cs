namespace VehicleInventorySystem.Api.DTOs.Request;

public class ResetPasswordRequest
{
    public string EmailAddress { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}
