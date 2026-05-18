using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.Extensions;
using VehicleInventorySystem.Api.DTOs.Response;

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
        try
        {
            if (GetCurrentUserId() != appointment.CustomerId)
            {
                return Forbid();
            }

            // Validate that the vehicle exists and belongs to the customer
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.Id == appointment.VehicleId && v.CustomerId == appointment.CustomerId);
            
            if (vehicle == null)
            {
                return BadRequest(new { message = "Vehicle not found or does not belong to you" });
            }

            // Ensure appointment date is in UTC
            appointment.AppointmentDate = DateTime.SpecifyKind(
                appointment.AppointmentDate,
                DateTimeKind.Utc
            );

            // Check if appointment date is in the future
            if (appointment.AppointmentDate <= DateTime.UtcNow)
            {
                return BadRequest(new { message = "Appointment date must be in the future" });
            }

            // Check if another appointment already exists for the same date and time (and not cancelled)
            var conflictingAppointment = await _context.Appointments
                .FirstOrDefaultAsync(a => 
                    a.AppointmentDate.Date == appointment.AppointmentDate.Date &&
                    a.AppointmentTime == appointment.AppointmentTime &&
                    a.Status != AppointmentStatus.Cancelled);

            if (conflictingAppointment != null)
            {
                return BadRequest(new { message = "This time slot is unavailable. Please choose another time." });
            }

            // Auto-confirm the appointment
            appointment.Status = AppointmentStatus.Confirmed;
            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Appointment booked successfully", appointment });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to book appointment", error = ex.Message });
        }
    }

    [Authorize(Roles = "Admin,Staff,Customer")]
    [HttpGet("appointments")]
    public async Task<ActionResult> GetAppointments([FromQuery] int? customerId, [FromQuery] int? pageNumber, [FromQuery] int? pageSize)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        
        if (role == "Customer")
        {
            var currentUserId = GetCurrentUserId();
            customerId = currentUserId;
        }

        var query = _context.Appointments
            .AsNoTracking()
            .Include(a => a.Vehicle)
            .Include(a => a.Customer)
            .OrderByDescending(a => a.AppointmentDate)
            .ThenByDescending(a => a.AppointmentTime)
            .AsQueryable();
        
        if (customerId.HasValue)
        {
            query = query.Where(a => a.CustomerId == customerId.Value);
        }

        if (pageNumber.HasValue || pageSize.HasValue)
        {
            return Ok(await query.ToPaginatedResponseAsync(pageNumber ?? 1, pageSize ?? 10));
        }

        return Ok(await query.ToListAsync());
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

    [Authorize(Roles = "Admin,Staff")]
    [HttpPatch("appointments/{id}/status")]
    public async Task<ActionResult> UpdateAppointmentStatus(int id, [FromBody] AppointmentStatus status)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            return NotFound();

        appointment.Status = status;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Appointment status updated", appointment });
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

    [Authorize(Roles = "Admin,Staff,Customer")]
    [HttpGet("part-requests")]
    public async Task<ActionResult<IEnumerable<PartRequest>>> GetPartRequests([FromQuery] int? customerId)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        
        if (role == "Customer")
        {
            var currentUserId = GetCurrentUserId();
            customerId = currentUserId;
        }

        var query = _context.PartRequests.AsQueryable();
        
        if (customerId.HasValue)
        {
            query = query.Where(pr => pr.CustomerId == customerId.Value);
        }

        return await query
            .Include(pr => pr.Customer)
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

    [Authorize(Roles = "Admin,Staff")]
    [HttpPatch("part-requests/{id}/status")]
    public async Task<ActionResult> UpdatePartRequestStatus(int id, [FromBody] bool isFulfilled)
    {
        var request = await _context.PartRequests.FindAsync(id);
        if (request == null)
            return NotFound();

        request.IsFulfilled = isFulfilled;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Part request status updated", request });
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

    // SpecialPartRequest Endpoints
    [Authorize(Roles = "Customer")]
    [HttpPost("special-part-requests")]
    public async Task<ActionResult<SpecialPartRequest>> CreateSpecialPartRequest([FromBody] SpecialPartRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null || currentUserId != request.CustomerId)
            {
                return Forbid();
            }

            // Validate required fields
            if (request.VehicleId <= 0)
            {
                return BadRequest(new { message = "VehicleId is required" });
            }

            if (request.Quantity <= 0)
            {
                return BadRequest(new { message = "Quantity must be greater than 0" });
            }

            if (request.PartId == null && string.IsNullOrWhiteSpace(request.CustomPartName))
            {
                return BadRequest(new { message = "Either PartId or CustomPartName is required" });
            }

            // Validate that the vehicle exists and belongs to the customer
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.Id == request.VehicleId && v.CustomerId == currentUserId);
            
            if (vehicle == null)
            {
                return BadRequest(new { message = "Vehicle not found or does not belong to you" });
            }

            // If PartId is provided, verify it exists
            if (request.PartId.HasValue && request.PartId > 0)
            {
                var part = await _context.Parts.FindAsync(request.PartId.Value);
                if (part == null)
                {
                    return BadRequest(new { message = "Part not found" });
                }
            }

            // Set status and timestamp
            request.Status = RequestStatus.Pending;
            request.RequestedAt = DateTime.UtcNow;

            _context.SpecialPartRequests.Add(request);
            await _context.SaveChangesAsync();

            // Reload with relationships
            var createdRequest = await _context.SpecialPartRequests
                .Include(spr => spr.Vehicle)
                .Include(spr => spr.Part)
                .FirstOrDefaultAsync(spr => spr.Id == request.Id);

            return CreatedAtAction(nameof(GetSpecialPartRequest), new { id = request.Id }, createdRequest);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to create special part request", error = ex.Message });
        }
    }

    [Authorize(Roles = "Customer")]
    [HttpGet("special-part-requests/{id}")]
    public async Task<ActionResult<SpecialPartRequest>> GetSpecialPartRequest(int id)
    {
        var request = await _context.SpecialPartRequests
            .Include(spr => spr.Vehicle)
            .Include(spr => spr.Part)
            .Include(spr => spr.Customer)
            .FirstOrDefaultAsync(spr => spr.Id == id);

        if (request == null)
        {
            return NotFound(new { message = "Special part request not found" });
        }

        var currentUserId = GetCurrentUserId();
        if (currentUserId != request.CustomerId)
        {
            return Forbid();
        }

        return Ok(request);
    }

    [Authorize(Roles = "Admin,Staff,Customer")]
    [HttpGet("special-part-requests")]
    public async Task<ActionResult> GetSpecialPartRequests([FromQuery] int? customerId, [FromQuery] int? pageNumber, [FromQuery] int? pageSize)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        
        if (role == "Customer")
        {
            var currentUserId = GetCurrentUserId();
            customerId = currentUserId;
        }

        var query = _context.SpecialPartRequests
            .AsNoTracking()
            .Include(spr => spr.Vehicle)
            .Include(spr => spr.Part)
            .Include(spr => spr.Customer)
            .OrderByDescending(spr => spr.RequestedAt)
            .AsQueryable();
        
        if (customerId.HasValue)
        {
            query = query.Where(spr => spr.CustomerId == customerId.Value);
        }

        if (pageNumber.HasValue || pageSize.HasValue)
        {
            return Ok(await query.ToPaginatedResponseAsync(pageNumber ?? 1, pageSize ?? 10));
        }

        return Ok(await query.ToListAsync());
    }

    [Authorize(Roles = "Customer")]
    [HttpPut("special-part-requests/{id}")]
    public async Task<ActionResult<SpecialPartRequest>> UpdateSpecialPartRequest(int id, [FromBody] SpecialPartRequest request)
    {
        if (id != request.Id)
            return BadRequest(new { message = "ID mismatch" });

        var currentUserId = GetCurrentUserId();
        if (currentUserId == null || currentUserId != request.CustomerId)
        {
            return Forbid();
        }

        var existing = await _context.SpecialPartRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(spr => spr.Id == id);
        
        if (existing == null)
        {
            return NotFound(new { message = "Special part request not found" });
        }

        if (currentUserId != existing.CustomerId)
        {
            return Forbid();
        }

        // Only allow updating certain fields
        request.CustomerId = existing.CustomerId;
        request.RequestedAt = existing.RequestedAt;
        request.Status = existing.Status;

        _context.Entry(request).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
            return Ok(request);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.SpecialPartRequests.Any(spr => spr.Id == id))
                return NotFound();
            throw;
        }
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpPatch("special-part-requests/{id}/status")]
    public async Task<ActionResult> UpdateSpecialPartRequestStatus(int id, [FromBody] RequestStatus status)
    {
        var request = await _context.SpecialPartRequests.FindAsync(id);
        if (request == null)
            return NotFound(new { message = "Special part request not found" });

        request.Status = status;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Special part request status updated", request });
    }

    [Authorize(Roles = "Customer")]
    [HttpDelete("special-part-requests/{id}")]
    public async Task<IActionResult> DeleteSpecialPartRequest(int id)
    {
        var request = await _context.SpecialPartRequests.FindAsync(id);
        if (request == null)
            return NotFound(new { message = "Special part request not found" });

        var currentUserId = GetCurrentUserId();
        if (currentUserId != request.CustomerId)
        {
            return Forbid();
        }

        _context.SpecialPartRequests.Remove(request);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Staff - Create Service Invoice (Service Record)
    [Authorize(Roles = "Admin,Staff")]
    [HttpPost("service-invoice")]
    public async Task<ActionResult<object>> CreateServiceInvoice([FromBody] CreateServiceInvoiceRequest request)
    {
        try
        {
            if (request == null)
                return BadRequest(new { message = "Request body is required." });

            if (request.CustomerId <= 0)
                return BadRequest(new { message = "Valid customer ID is required." });

            if (request.VehicleId <= 0)
                return BadRequest(new { message = "Valid vehicle ID is required." });

            if (string.IsNullOrWhiteSpace(request.ServiceType))
                return BadRequest(new { message = "Service type is required." });

            if (request.ServiceCharge < 0)
                return BadRequest(new { message = "Service charge cannot be negative." });

            var paymentStatus = string.IsNullOrWhiteSpace(request.PaymentStatus)
                ? "full-payment"
                : request.PaymentStatus.Trim();
            var isPaid = paymentStatus == "full-payment";
            var currentUserId = GetCurrentUserId();

            // Validate customer exists
            var customer = await _context.Users.FindAsync(request.CustomerId);
            if (customer == null)
                return BadRequest(new { message = "Customer not found." });

            // Validate vehicle exists and belongs to customer
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.Id == request.VehicleId && v.CustomerId == request.CustomerId);
            if (vehicle == null)
                return BadRequest(new { message = "Vehicle not found or does not belong to this customer." });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var serviceDate = DateTime.SpecifyKind(request.ServiceDate, DateTimeKind.Utc);
                var serviceStatus = serviceDate <= DateTime.UtcNow
                    ? AppointmentStatus.Completed
                    : AppointmentStatus.Confirmed;

                var invoice = new Invoice
                {
                    Type = InvoiceType.Sale,
                    Date = serviceDate,
                    TotalAmount = request.ServiceCharge,
                    IsPaid = isPaid,
                    PaymentStatus = paymentStatus,
                    CreatedById = currentUserId,
                    CustomerId = request.CustomerId,
                    VehicleId = request.VehicleId
                };

                var appointment = new Appointment
                {
                    CustomerId = request.CustomerId,
                    VehicleId = request.VehicleId,
                    AppointmentDate = serviceDate,
                    AppointmentTime = TimeSpan.Zero, // Not used for service invoices
                    ServiceType = request.ServiceType,
                    Description = request.Description ?? string.Empty,
                    Cost = request.ServiceCharge,
                    Status = serviceStatus,
                    RescheduleCount = 0
                };

                _context.Invoices.Add(invoice);
                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var invoiceNumber = $"SVC-{invoice.Id:D6}";

                return Ok(new
                {
                    id = invoice.Id,
                    appointmentId = appointment.Id,
                    invoiceNumber = invoiceNumber,
                    customerId = appointment.CustomerId,
                    customerName = customer.Name,
                    customerEmail = customer.Email,
                    vehicleId = appointment.VehicleId,
                    vehiclePlate = vehicle.PlateNumber,
                    vehicleModel = vehicle.Model,
                    serviceType = appointment.ServiceType,
                    serviceDate = appointment.AppointmentDate,
                    description = appointment.Description,
                    mechanicNotes = request.MechanicNotes ?? string.Empty,
                    mileage = request.Mileage,
                    serviceCharge = invoice.TotalAmount,
                    paymentStatus = invoice.PaymentStatus,
                    status = appointment.Status.ToString(),
                    createdAt = DateTime.UtcNow
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to create service invoice", error = ex.Message });
        }
    }

    private int? GetCurrentUserId()
    {
        var claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claimValue, out var userId) ? userId : null;
    }
}
