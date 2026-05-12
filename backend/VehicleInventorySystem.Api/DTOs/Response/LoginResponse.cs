namespace VehicleInventorySystem.Api.DTOs.Response;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string EmailAddress { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
