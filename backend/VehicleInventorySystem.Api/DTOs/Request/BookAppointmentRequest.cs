using System.ComponentModel.DataAnnotations;

namespace VehicleInventorySystem.Api.DTOs.Request;

public class BookAppointmentRequest
{
    [Required]
    public int CustomerId { get; set; }

    [Required]
    public int VehicleId { get; set; }

    [Required]
    [DataType(DataType.Date)]
    public DateTime AppointmentDate { get; set; }

    [Required]
    public TimeSpan AppointmentTime { get; set; }

    [Required]
    [StringLength(100)]
    public string ServiceType { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }
}
