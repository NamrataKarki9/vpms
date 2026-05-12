namespace VehicleInventorySystem.Api.DTOs.Response;

public class GenericResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int StatusCode { get; set; }
}
