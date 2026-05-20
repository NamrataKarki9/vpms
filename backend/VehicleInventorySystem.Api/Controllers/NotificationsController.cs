using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] string? role, [FromQuery] int? userId)
    {
        var currentRole = User.FindFirstValue(ClaimTypes.Role);
        var currentUserId = GetCurrentUserId();

        if (string.IsNullOrWhiteSpace(role))
        {
            role = currentRole;
        }

        if (!userId.HasValue && string.Equals(role, "Customer", StringComparison.OrdinalIgnoreCase))
        {
            userId = currentUserId;
        }

        var notifications = await _notificationService.GetNotificationsAsync(role, userId);
        return Ok(notifications);
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = GetCurrentUserId();
        var updated = await _notificationService.MarkAsReadAsync(id, role, userId);
        return updated ? Ok(new { message = "Notification marked as read." }) : NotFound();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead([FromQuery] string? role, [FromQuery] int? userId)
    {
        var currentRole = User.FindFirstValue(ClaimTypes.Role);
        var currentUserId = GetCurrentUserId();

        if (string.IsNullOrWhiteSpace(role))
        {
            role = currentRole;
        }

        if (!userId.HasValue && string.Equals(role, "Customer", StringComparison.OrdinalIgnoreCase))
        {
            userId = currentUserId;
        }

        var updated = await _notificationService.MarkAllAsReadAsync(role, userId);
        return Ok(new { message = $"{updated} notifications marked as read." });
    }

    private int? GetCurrentUserId()
    {
        var claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claimValue, out var userId) ? userId : null;
    }
}