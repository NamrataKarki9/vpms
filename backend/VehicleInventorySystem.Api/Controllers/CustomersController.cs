using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _context;

    public CustomersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<object>>> GetCustomers(
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Users
            .Include(u => u.Vehicles)
            .Where(u => u.Role == UserRole.Customer);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search}%";
            query = query.Where(u =>
                EF.Functions.ILike(u.Name, pattern) ||
                (u.Vehicles != null && u.Vehicles.Any(v => EF.Functions.ILike(v.PlateNumber, pattern))));
        }

        var totalItems = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = await query
            .OrderBy(u => u.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new {
                u.Id,
                u.Name,
                u.Email,
                u.PhoneNumber,
                u.IsActive,
                u.CreatedAt,
                Vehicles = u.Vehicles!.Select(v => new {
                    v.Id, v.PlateNumber, v.Model, v.Make, v.Year, v.FuelType, v.Mileage
                })
            })
            .ToListAsync();

        return Ok(new PaginatedResponse<object> {
            Items = items.Select(i => (object)i).ToList(),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
            HasNextPage = pageNumber < totalPages,
            HasPreviousPage = pageNumber > 1
        });
    }

    // Get a single customer by ID
    [HttpGet("{customerId}")]
    public async Task<ActionResult> GetCustomer(int customerId)
    {
        var customer = await _context.Users
            .Include(u => u.Vehicles)
            .Where(u => u.Role == UserRole.Customer && u.Id == customerId)
            .Select(u => new {
                u.Id,
                u.Name,
                u.Email,
                u.PhoneNumber,
                u.IsActive,
                u.CreatedAt,
                Vehicles = u.Vehicles!.Select(v => new {
                    v.Id, v.PlateNumber, v.Model, v.Make, v.Year, v.FuelType, v.Mileage
                })
            })
            .FirstOrDefaultAsync();

        if (customer == null)
            return NotFound(new { message = "Customer not found" });

        return Ok(customer);
    }

    // F12: Customers - Add vehicle to profile
    [HttpPost("{customerId}/vehicles")]
    public async Task<ActionResult<Vehicle>> AddVehicle(int customerId, [FromBody] AddVehicleRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { message = "Invalid vehicle data", errors = ModelState });

        // Verify customer exists
        var customer = await _context.Users.FindAsync(customerId);
        if (customer == null)
            return NotFound(new { message = "Customer not found" });

        // Check if vehicle with same plate already exists for this customer
        var existingVehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.CustomerId == customerId && v.PlateNumber == request.PlateNumber);
        
        if (existingVehicle != null)
            return BadRequest(new { message = "Vehicle with this plate number already exists" });

        var vehicle = new Vehicle
        {
            CustomerId = customerId,
            PlateNumber = request.PlateNumber.Trim(),
            Model = request.Model.Trim(),
            Make = request.Make.Trim(),
            Year = request.Year,
            FuelType = request.FuelType?.Trim(),
            Mileage = request.Mileage
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetVehicles), new { customerId }, vehicle);
    }

    // F12: Customers - Get all vehicles for a customer
    [HttpGet("{customerId}/vehicles")]
    public async Task<ActionResult<IEnumerable<Vehicle>>> GetVehicles(int customerId)
    {
        var customer = await _context.Users.FindAsync(customerId);
        if (customer == null)
            return NotFound(new { message = "Customer not found" });

        var vehicles = await _context.Vehicles
            .Where(v => v.CustomerId == customerId)
            .ToListAsync();
        
        return Ok(vehicles);
    }

    // F12: Customers - Update vehicle details
    [HttpPut("{customerId}/vehicles/{vehicleId}")]
    public async Task<ActionResult<Vehicle>> UpdateVehicle(int customerId, int vehicleId, [FromBody] AddVehicleRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { message = "Invalid vehicle data", errors = ModelState });

        var vehicle = await _context.Vehicles.FindAsync(vehicleId);
        if (vehicle == null || vehicle.CustomerId != customerId)
            return NotFound(new { message = "Vehicle not found" });

        vehicle.PlateNumber = request.PlateNumber.Trim();
        vehicle.Model = request.Model.Trim();
        vehicle.Make = request.Make.Trim();
        vehicle.Year = request.Year;
        vehicle.FuelType = request.FuelType?.Trim();
        vehicle.Mileage = request.Mileage;

        _context.Vehicles.Update(vehicle);
        await _context.SaveChangesAsync();
        
        return Ok(new { message = "Vehicle updated successfully", vehicle });
    }

    // F12: Customers - Delete vehicle
    [HttpDelete("{customerId}/vehicles/{vehicleId}")]
    public async Task<ActionResult> DeleteVehicle(int customerId, int vehicleId)
    {
        var vehicle = await _context.Vehicles.FindAsync(vehicleId);
        if (vehicle == null || vehicle.CustomerId != customerId)
            return NotFound(new { message = "Vehicle not found" });

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();
        
        return Ok(new { message = "Vehicle deleted successfully" });
    }

    // F10: Staff - Search customers by vehicle number, phone, ID, or name
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<User>>> SearchCustomers([FromQuery] string query)
    {
        var customers = await _context.Users
            .Include(u => u.Vehicles)
            .Where(u => u.Role == UserRole.Customer && 
                (u.Name.Contains(query) || 
                 (u.Email != null && u.Email.Contains(query)) || 
                 (u.Vehicles != null && u.Vehicles.Any(v => v.PlateNumber.Contains(query)))))
            .ToListAsync();
        return customers;
    }

    [Authorize(Roles = "Admin,Staff,Customer")]
    // F14: Customers - View their purchase/service history
    [HttpGet("{customerId}/history")]
    public async Task<ActionResult<IEnumerable<Invoice>>> GetHistory(int customerId)
    {
        if (User.IsInRole(nameof(UserRole.Customer)) && GetCurrentUserId() != customerId)
        {
            return Forbid();
        }

        return await _context.Invoices
            .Include(i => i.Items)
            .ThenInclude(ii => ii.Part)
            .Where(i => i.CustomerId == customerId)
            .OrderByDescending(i => i.Date)
            .ToListAsync();
    }

    private int? GetCurrentUserId()
    {
        var claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claimValue, out var userId) ? userId : null;
    }
}
