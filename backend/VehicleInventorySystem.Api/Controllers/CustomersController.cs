using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.Models;

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

    [Authorize(Roles = "Admin,Staff")]
    // F6: Staff - Register new customers with vehicle details
    [HttpPost("{customerId}/vehicles")]
    public async Task<ActionResult<Vehicle>> AddVehicle(int customerId, Vehicle vehicle)
    {
        vehicle.CustomerId = customerId;
        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();
        return Ok(vehicle);
    }

    [Authorize(Roles = "Admin,Staff")]
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
