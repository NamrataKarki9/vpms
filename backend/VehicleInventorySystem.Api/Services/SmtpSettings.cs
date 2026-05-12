namespace VehicleInventorySystem.Api.Services;

public class SmtpSettings
{
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "noreply@vehicleinventory.com";
    public string FromName { get; set; } = "Vehicle Inventory System";
    public bool EnableSsl { get; set; } = true;
}
