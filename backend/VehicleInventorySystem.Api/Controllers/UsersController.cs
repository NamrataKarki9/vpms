using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] UserRole? role)
    {
        return await ExecuteAsync(() => _userService.GetAllUsersAsync(role));
    }

    [HttpGet("staff")]
    public async Task<IActionResult> GetAllStaff()
    {
        return await ExecuteAsync(() => _userService.GetAllStaffAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUser(int id)
    {
        return await ExecuteAsync(() => _userService.GetUserByIdAsync(id));
    }

    [HttpPost("staff")]
    [HttpPost("register/staff")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffRequest request)
    {
        return await ExecuteAsync(async () =>
        {
            var created = await _userService.CreateStaffAsync(request);
            return CreatedAtAction(nameof(GetUser), new { id = created.Id }, created);
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        return await ExecuteAsync(() => _userService.UpdateUserAsync(id, request));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        return await ExecuteAsync(() => _userService.ToggleUserStatusAsync(id));
    }

    private async Task<IActionResult> ExecuteAsync<T>(Func<Task<T>> action)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { message = "Invalid input.", errors = ModelState });
        }

        var result = await action();
        return Ok(result);
    }

    private async Task<IActionResult> ExecuteAsync(Func<Task<IActionResult>> action)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { message = "Invalid input.", errors = ModelState });
        }

        return await action();
    }
}
