using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.Models;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _context;

    public InventoryController(AppDbContext context)
    {
        _context = context;
    }

    // F5: Admin - Manage vendor details
    [HttpPost("vendors")]
    public async Task<ActionResult<Vendor>> CreateVendor(Vendor vendor)
    {
        _context.Vendors.Add(vendor);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetVendor), new { id = vendor.Id }, vendor);
    }

    [HttpGet("vendors/{id}")]
    public async Task<ActionResult<Vendor>> GetVendor(int id)
    {
        var vendor = await _context.Vendors.Include(v => v.Parts).FirstOrDefaultAsync(v => v.Id == id);
        if (vendor == null) return NotFound();
        return vendor;
    }

    [HttpGet("vendors")]
    public async Task<ActionResult<IEnumerable<Vendor>>> GetVendors() => await _context.Vendors.ToListAsync();

    // F3: Admin - Parts management
    [HttpPost("parts")]
    public async Task<ActionResult<Part>> CreatePart(Part part)
    {
        _context.Parts.Add(part);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPart), new { id = part.Id }, part);
    }

    [HttpGet("parts")]
    public async Task<ActionResult<IEnumerable<Part>>> GetParts() => await _context.Parts.Include(p => p.Vendor).ToListAsync();

    [HttpGet("parts/{id}")]
    public async Task<ActionResult<Part>> GetPart(int id)
    {
        var part = await _context.Parts.Include(p => p.Vendor).FirstOrDefaultAsync(p => p.Id == id);
        if (part == null) return NotFound();
        return part;
    }

    // F15: System - Low stock check
    [HttpGet("parts/low-stock")]
    public async Task<ActionResult<IEnumerable<Part>>> GetLowStockParts()
    {
        return await _context.Parts.Where(p => p.StockLevel < 10).ToListAsync();
    }
}
