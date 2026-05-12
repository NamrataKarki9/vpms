using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;

    public AuthController(IAuthService authService, IUserService userService)
    {
        _authService = authService;
        _userService = userService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        return await ExecuteAsync(() => _userService.LoginAsync(request));
    }

    [AllowAnonymous]
    [HttpPost("register/customer")]
    public async Task<IActionResult> RegisterCustomer([FromBody] CreateCustomerRequest request)
    {
        return await ExecuteAsync(async () =>
        {
            var created = await _userService.CreateCustomerAsync(request);
            return CreatedAtAction(nameof(Login), new { id = created.Id }, created);
        });
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        return await ExecuteAsync(() => _authService.ForgotPasswordAsync(request));
    }

    [AllowAnonymous]
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        return await ExecuteAsync(() => _authService.VerifyOtpAsync(request));
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        return await ExecuteAsync(() => _authService.ResetPasswordAsync(request));
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
