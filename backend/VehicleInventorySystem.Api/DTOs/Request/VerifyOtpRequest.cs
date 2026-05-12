namespace VehicleInventorySystem.Api.DTOs.Request;

public class VerifyOtpRequest
{
    public string EmailAddress { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
}
