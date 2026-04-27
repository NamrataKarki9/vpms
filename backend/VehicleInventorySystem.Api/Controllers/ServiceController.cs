using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.Models;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiceController : ControllerBase
{
    private readonly AppDbContext _context;

    public ServiceController(AppDbContext context)
    {
        _context = context;
    }

    // F13: Book Appointments
    [HttpPost("appointments")]
    public async Task<ActionResult<Appointment>> BookAppointment(Appointment appointment)
    {
        appointment.Status = AppointmentStatus.Pending;
        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();
        return Ok(appointment);
    }

    [HttpGet("appointments")]
    public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments([FromQuery] int? customerId)
    {
        var query = _context.Appointments.AsQueryable();
        if (customerId.HasValue) query = query.Where(a => a.CustomerId == customerId);
        return await query.Include(a => a.Vehicle).ToListAsync();
    }

    // F13: Request Unavailable Parts
    [HttpPost("part-requests")]
    public async Task<ActionResult<PartRequest>> RequestPart(PartRequest request)
    {
        _context.PartRequests.Add(request);
        await _context.SaveChangesAsync();
        return Ok(request);
    }

    // F13: Service Reviews
    [HttpPost("reviews")]
    public async Task<ActionResult<ServiceReview>> SubmitReview(ServiceReview review)
    {
        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();
        return Ok(review);
    }

    [HttpGet("reviews")]
    public async Task<ActionResult<IEnumerable<ServiceReview>>> GetReviews() => await _context.Reviews.Include(r => r.Customer).ToListAsync();
}
