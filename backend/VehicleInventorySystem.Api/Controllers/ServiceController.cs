using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.DTOs.Request;

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

    [HttpPost("appointments")]
    public async Task<ActionResult<Appointment>> BookAppointment([FromBody] BookAppointmentRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { message = "Invalid appointment data", errors = ModelState });

        // Verify customer exists
        var customer = await _context.Users.FindAsync(request.CustomerId);
        if (customer == null)
            return NotFound(new { message = "Customer not found" });

        // Verify vehicle exists and belongs to customer
        var vehicle = await _context.Vehicles.FindAsync(request.VehicleId);
        if (vehicle == null || vehicle.CustomerId != request.CustomerId)
            return BadRequest(new { message = "Vehicle not found or doesn't belong to this customer" });

        // Validate appointment date is in future
        if (request.AppointmentDate.Date <= DateTime.UtcNow.Date)
            return BadRequest(new { message = "Appointment date must be in the future" });

        var appointment = new Appointment
        {
            CustomerId = request.CustomerId,
            VehicleId = request.VehicleId,
            AppointmentDate = request.AppointmentDate,
            AppointmentTime = request.AppointmentTime,
            ServiceType = request.ServiceType.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Status = AppointmentStatus.Pending,
            RescheduleCount = 0
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Appointment booked successfully", appointment });
    }

    [HttpGet("appointments")]
    public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments([FromQuery] int? customerId)
    {
        var query = _context.Appointments.AsQueryable();
        if (customerId.HasValue) query = query.Where(a => a.CustomerId == customerId);
        return await query.Include(a => a.Vehicle).ToListAsync();
    }

    [HttpPut("appointments/{id}")]
    public async Task<ActionResult<Appointment>> UpdateAppointment(int id, Appointment appointment)
    {
        if (id != appointment.Id)
            return BadRequest("ID mismatch");

        _context.Entry(appointment).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
            return Ok(appointment);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Appointments.Any(a => a.Id == id))
                return NotFound();
            throw;
        }
    }

    [HttpDelete("appointments/{id}")]
    public async Task<IActionResult> DeleteAppointment(int id)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            return NotFound();

        _context.Appointments.Remove(appointment);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // F13: Request Unavailable Parts
    [HttpPost("part-requests")]
    public async Task<ActionResult<PartRequest>> RequestPart(PartRequest request)
    {
        request.RequestDate = DateTime.UtcNow;
        _context.PartRequests.Add(request);
        await _context.SaveChangesAsync();
        return Ok(request);
    }

    [HttpGet("part-requests")]
    public async Task<ActionResult<IEnumerable<PartRequest>>> GetPartRequests([FromQuery] int? customerId)
    {
        var query = _context.PartRequests.AsQueryable();
        if (customerId.HasValue) query = query.Where(pr => pr.CustomerId == customerId);
        return await query.ToListAsync();
    }

    [HttpPut("part-requests/{id}")]
    public async Task<ActionResult<PartRequest>> UpdatePartRequest(int id, PartRequest request)
    {
        if (id != request.Id)
            return BadRequest("ID mismatch");

        _context.Entry(request).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
            return Ok(request);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.PartRequests.Any(pr => pr.Id == id))
                return NotFound();
            throw;
        }
    }

    [HttpDelete("part-requests/{id}")]
    public async Task<IActionResult> DeletePartRequest(int id)
    {
        var request = await _context.PartRequests.FindAsync(id);
        if (request == null)
            return NotFound();

        _context.PartRequests.Remove(request);
        await _context.SaveChangesAsync();
        return NoContent();
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
