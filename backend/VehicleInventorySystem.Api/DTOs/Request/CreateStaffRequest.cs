using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace VehicleInventorySystem.Api.DTOs.Request;

public class CreateStaffRequest
{
    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("emailAddress")]
    public string EmailAddress { get; set; } = string.Empty;

    [JsonPropertyName("phoneNumber")]
    public string PhoneNumber { get; set; } = string.Empty;

    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;

    [JsonPropertyName("confirmPassword")]
    public string ConfirmPassword { get; set; } = string.Empty;

    public string? Name { get; set; }

    public string? Email { get; set; }

    public string ResolvedFullName => string.IsNullOrWhiteSpace(FullName)
        ? Name?.Trim() ?? string.Empty
        : FullName.Trim();

    public string ResolvedEmailAddress => string.IsNullOrWhiteSpace(EmailAddress)
        ? Email?.Trim() ?? string.Empty
        : EmailAddress.Trim();

    public string ResolvedPhoneNumber => PhoneNumber?.Trim() ?? string.Empty;

    public string ResolvedConfirmPassword => string.IsNullOrWhiteSpace(ConfirmPassword)
        ? Password?.Trim() ?? string.Empty
        : ConfirmPassword.Trim();
}
