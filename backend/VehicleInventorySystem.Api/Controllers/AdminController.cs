using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.DTOs.Response;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("low-stock-notifications")]
    public async Task<ActionResult<IEnumerable<LowStockNotificationResponse>>> GetLowStockNotifications()
    {
        var notifications = await _context.Parts
            .AsNoTracking()
            .Where(part => part.StockLevel < 10)
            .OrderBy(part => part.StockLevel)
            .ThenBy(part => part.Name)
            .Select(part => new LowStockNotificationResponse
            {
                PartId = part.Id,
                PartName = part.Name,
                PartCode = part.PartCode,
                CurrentStock = part.StockLevel,
                Message = $"{part.Name} is low in stock. Only {part.StockLevel} units left."
            })
            .ToListAsync();

        return Ok(notifications);
    }
}