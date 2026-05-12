using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.DTOs.Request;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _context;

    public CustomersController(AppDbContext context)
    {
        _context = context;
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
                 u.Email.Contains(query) || 
                 (u.Vehicles != null && u.Vehicles.Any(v => v.PlateNumber.Contains(query)))))
            .ToListAsync();
        return customers;
    }

    // F14: Customers - View their purchase/service history
    [HttpGet("{customerId}/history")]
    public async Task<ActionResult<IEnumerable<Invoice>>> GetHistory(int customerId)
    {
        return await _context.Invoices
            .Include(i => i.Items)
            .ThenInclude(ii => ii.Part)
            .Where(i => i.CustomerId == customerId)
            .OrderByDescending(i => i.Date)
            .ToListAsync();
    }
}
