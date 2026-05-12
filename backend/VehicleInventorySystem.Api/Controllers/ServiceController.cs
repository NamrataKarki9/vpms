using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.DTOs.Request;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServiceController : ControllerBase
{
    private readonly AppDbContext _context;

    public ServiceController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("appointments")]
    public async Task<ActionResult<Appointment>> BookAppointment(Appointment appointment)
    {
        if (GetCurrentUserId() != appointment.CustomerId)
        {
            return Forbid();
        }

        appointment.Status = AppointmentStatus.Pending;
        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Appointment booked successfully", appointment });
    }

    [Authorize(Roles = "Customer")]
    [HttpGet("appointments")]
    public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments([FromQuery] int? customerId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Forbid();
        }

        customerId = currentUserId;

        return await _context.Appointments
            .Where(a => a.CustomerId == customerId)
            .Include(a => a.Vehicle)
            .ToListAsync();
    }

    [Authorize(Roles = "Customer")]
    [HttpPut("appointments/{id}")]
    public async Task<ActionResult<Appointment>> UpdateAppointment(int id, Appointment appointment)
    {
        if (id != appointment.Id)
            return BadRequest("ID mismatch");

        var existing = await _context.Appointments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        if (existing == null)
        {
            return NotFound();
        }

        if (GetCurrentUserId() != existing.CustomerId)
        {
            return Forbid();
        }

        appointment.CustomerId = existing.CustomerId;

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

    [Authorize(Roles = "Customer")]
    [HttpDelete("appointments/{id}")]
    public async Task<IActionResult> DeleteAppointment(int id)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            return NotFound();

        if (GetCurrentUserId() != appointment.CustomerId)
        {
            return Forbid();
        }

        _context.Appointments.Remove(appointment);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // F13: Request Unavailable Parts
    [Authorize(Roles = "Customer")]
    [HttpPost("part-requests")]
    public async Task<ActionResult<PartRequest>> RequestPart(PartRequest request)
    {
        if (GetCurrentUserId() != request.CustomerId)
        {
            return Forbid();
        }

        request.RequestDate = DateTime.UtcNow;
        _context.PartRequests.Add(request);
        await _context.SaveChangesAsync();
        return Ok(request);
    }

    [Authorize(Roles = "Customer")]
    [HttpGet("part-requests")]
    public async Task<ActionResult<IEnumerable<PartRequest>>> GetPartRequests([FromQuery] int? customerId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Forbid();
        }

        customerId = currentUserId;

        return await _context.PartRequests
            .Where(pr => pr.CustomerId == customerId)
            .ToListAsync();
    }

    [Authorize(Roles = "Customer")]
    [HttpPut("part-requests/{id}")]
    public async Task<ActionResult<PartRequest>> UpdatePartRequest(int id, PartRequest request)
    {
        if (id != request.Id)
            return BadRequest("ID mismatch");

        var existing = await _context.PartRequests.AsNoTracking().FirstOrDefaultAsync(pr => pr.Id == id);
        if (existing == null)
        {
            return NotFound();
        }

        if (GetCurrentUserId() != existing.CustomerId)
        {
            return Forbid();
        }

        request.CustomerId = existing.CustomerId;

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

    [Authorize(Roles = "Customer")]
    [HttpDelete("part-requests/{id}")]
    public async Task<IActionResult> DeletePartRequest(int id)
    {
        var request = await _context.PartRequests.FindAsync(id);
        if (request == null)
            return NotFound();

        if (GetCurrentUserId() != request.CustomerId)
        {
            return Forbid();
        }

        _context.PartRequests.Remove(request);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // F13: Service Reviews
    [Authorize(Roles = "Customer")]
    [HttpPost("reviews")]
    public async Task<ActionResult<ServiceReview>> SubmitReview(ServiceReview review)
    {
        if (GetCurrentUserId() != review.CustomerId)
        {
            return Forbid();
        }

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();
        return Ok(review);
    }

    [Authorize(Roles = "Customer")]
    [HttpGet("reviews")]
    public async Task<ActionResult<IEnumerable<ServiceReview>>> GetReviews()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return Forbid();
        }

        return await _context.Reviews
            .Where(r => r.CustomerId == currentUserId)
            .Include(r => r.Customer)
            .ToListAsync();
    }

    private int? GetCurrentUserId()
    {
        var claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claimValue, out var userId) ? userId : null;
    }
}
