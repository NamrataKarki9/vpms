using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.DTOs.Request;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    // F12 & F8: Customer Self-Registration
    [HttpPost("register/customer")]
    public async Task<ActionResult<User>> RegisterCustomer([FromBody] CreateCustomerRequest request)
    {
        // Validation
        if (!ModelState.IsValid)
        {
            return BadRequest(new { message = "Invalid input", errors = ModelState });
        }

        // Check if email already exists
        var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower());
        if (emailExists)
        {
            return BadRequest(new { message = "Email already registered. Please use a different email or login." });
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            PasswordHash = request.Password, // In production, hash the password!
            Role = UserRole.Customer,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Add vehicles if provided
        if (request.Vehicles != null && request.Vehicles.Count > 0)
        {
            foreach (var vehicleDto in request.Vehicles)
            {
                var vehicle = new Vehicle
                {
                    CustomerId = user.Id,
                    PlateNumber = vehicleDto.PlateNumber ?? string.Empty,
                    Model = vehicleDto.Model ?? string.Empty,
                    Make = vehicleDto.Make ?? string.Empty,
                    Year = vehicleDto.Year
                };
                _context.Vehicles.Add(vehicle);
            }
            await _context.SaveChangesAsync();
        }
        
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new 
        { 
            id = user.Id,
            name = user.Name, 
            email = user.Email,
            phoneNumber = user.PhoneNumber,
            role = user.Role.ToString(),
            message = "Customer registered successfully"
        });
    }

    // F2: Admin - Manage staff registration
    [HttpPost("register/staff")]
    public async Task<ActionResult<User>> RegisterStaff([FromBody] CreateStaffRequest request)
    {
        // Validation
        if (!ModelState.IsValid)
        {
            return BadRequest(new { message = "Invalid input", errors = ModelState });
        }

        // Check if email already exists
        var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower());
        if (emailExists)
        {
            return BadRequest(new { message = "Email already registered. Please use a different email." });
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            PasswordHash = request.Password, // In production, hash the password!
            Role = UserRole.Staff,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new 
        { 
            id = user.Id,
            name = user.Name, 
            email = user.Email, 
            role = user.Role.ToString(),
            message = "Staff member registered successfully"
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetUser(int id)
    {
        var user = await _context.Users.Include(u => u.Vehicles).FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();
        return user;
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        // First validate required fields
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Name is required" });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email is required" });
        }

        // Validate name length
        if (request.Name.Trim().Length < 2)
        {
            return BadRequest(new { message = "Name must be at least 2 characters" });
        }

        // Validate email format
        if (!request.Email.Contains("@") || !request.Email.Contains("."))
        {
            return BadRequest(new { message = "Invalid email format" });
        }

        // Validate password if provided
        if (!string.IsNullOrEmpty(request.Password))
        {
            var trimmedPassword = request.Password.Trim();
            if (trimmedPassword.Length < 8)
            {
                return BadRequest(new { message = "Password must be at least 8 characters" });
            }
        }

        if (id <= 0)
        {
            return BadRequest(new { message = "Invalid user id" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // Check if email already exists for another user
        var emailExists = await _context.Users.AnyAsync(u => 
            u.Id != id && u.Email.ToLower() == request.Email.Trim().ToLower());
        
        if (emailExists)
        {
            return BadRequest(new { message = "Email already exists" });
        }

        // Update user details
        user.Name = request.Name.Trim();
        user.Email = request.Email.Trim();
        user.PhoneNumber = request.PhoneNumber?.Trim();
        
        // Update password only if provided
        if (!string.IsNullOrEmpty(request.Password))
        {
            var trimmedPassword = request.Password.Trim();
            if (trimmedPassword.Length > 0)
            {
                user.PasswordHash = trimmedPassword; // In production, hash the password!
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Staff member updated successfully", user = new { id = user.Id, name = user.Name, email = user.Email, phoneNumber = user.PhoneNumber, role = user.Role } });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        // Validation
        if (id <= 0)
        {
            return BadRequest(new { message = "Invalid user id" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // Prevent deletion of admin accounts
        if (user.Role == UserRole.Admin)
        {
            return BadRequest(new { message = "Cannot delete admin accounts" });
        }

        // For customers, mark as inactive instead of deleting
        if (user.Role == UserRole.Customer)
        {
            user.IsActive = false;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Customer marked as inactive successfully" });
        }

        // For staff, delete completely
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Staff member removed successfully" });
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers([FromQuery] UserRole? role)
    {
        var query = _context.Users.AsQueryable();
        if (role.HasValue) query = query.Where(u => u.Role == role);
        return await query.ToListAsync();
    }
}
