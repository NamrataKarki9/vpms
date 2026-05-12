using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Services.Implementations;

public class PartService : IPartService
{
    private readonly AppDbContext _context;

    public PartService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<PartResponse>> GetAllPartsAsync()
    {
        var parts = await _context.Parts
            .AsNoTracking()
            .Include(p => p.Vendor)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return parts.Select(MapToResponse).ToList();
    }

    public async Task<PartResponse?> GetPartByIdAsync(int id)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid input: part id must be greater than zero.");
        }

        var part = await _context.Parts
            .AsNoTracking()
            .Include(p => p.Vendor)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (part == null)
        {
            throw new KeyNotFoundException("Part not found.");
        }

        return MapToResponse(part);
    }

    public async Task<PartResponse> CreatePartAsync(CreatePartRequest request)
    {
        ValidatePartInput(request.Name, request.PartCode, request.Price, request.StockLevel, request.VendorId);

        var normalizedCode = request.PartCode.Trim().ToLowerInvariant();
        var duplicateCode = await _context.Parts.AnyAsync(p => p.PartCode.ToLower() == normalizedCode);
        if (duplicateCode)
        {
            throw new InvalidOperationException("Part code already exists.");
        }

        var vendorExists = await _context.Vendors.AnyAsync(v => v.Id == request.VendorId);
        if (!vendorExists)
        {
            throw new KeyNotFoundException("Vendor not found.");
        }

        var part = new Part
        {
            Name = request.Name.Trim(),
            PartCode = request.PartCode.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Price = request.Price,
            StockLevel = request.StockLevel,
            VendorId = request.VendorId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null
        };

        _context.Parts.Add(part);
        await _context.SaveChangesAsync();

        return await GetPartByIdAsync(part.Id)
            ?? throw new InvalidOperationException("Failed to create part.");
    }

    public async Task<PartResponse> UpdatePartAsync(int id, UpdatePartRequest request)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid input: part id must be greater than zero.");
        }

        ValidatePartInput(request.Name, request.PartCode, request.Price, request.StockLevel, request.VendorId);

        var part = await _context.Parts.FirstOrDefaultAsync(p => p.Id == id);
        if (part == null)
        {
            throw new KeyNotFoundException("Part not found.");
        }

        var normalizedCode = request.PartCode.Trim().ToLowerInvariant();
        var duplicateCode = await _context.Parts.AnyAsync(p => p.Id != id && p.PartCode.ToLower() == normalizedCode);
        if (duplicateCode)
        {
            throw new InvalidOperationException("Part code already exists.");
        }

        var vendorExists = await _context.Vendors.AnyAsync(v => v.Id == request.VendorId);
        if (!vendorExists)
        {
            throw new KeyNotFoundException("Vendor not found.");
        }

        part.Name = request.Name.Trim();
        part.PartCode = request.PartCode.Trim();
        part.Description = request.Description?.Trim() ?? string.Empty;
        part.Price = request.Price;
        part.StockLevel = request.StockLevel;
        part.VendorId = request.VendorId;
        part.IsActive = request.IsActive;
        part.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetPartByIdAsync(part.Id)
            ?? throw new InvalidOperationException("Failed to update part.");
    }

    public async Task<PartResponse> TogglePartStatusAsync(int id)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid input: part id must be greater than zero.");
        }

        var part = await _context.Parts.FirstOrDefaultAsync(p => p.Id == id);
        if (part == null)
        {
            throw new KeyNotFoundException("Part not found.");
        }

        part.IsActive = !part.IsActive;
        part.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetPartByIdAsync(part.Id)
            ?? throw new InvalidOperationException("Failed to update part status.");
    }

    private static void ValidatePartInput(string name, string partCode, decimal price, int stockLevel, int vendorId)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(partCode) || vendorId <= 0)
        {
            throw new ArgumentException("Please fill in all required fields.");
        }

        if (price < 0)
        {
            throw new ArgumentException("Price cannot be negative.");
        }

        if (stockLevel < 0)
        {
            throw new ArgumentException("Stock level cannot be negative.");
        }
    }

    private static PartResponse MapToResponse(Part part)
    {
        return new PartResponse
        {
            Id = part.Id,
            Name = part.Name,
            PartCode = part.PartCode,
            Description = part.Description,
            Price = part.Price,
            StockLevel = part.StockLevel,
            IsActive = part.IsActive,
            VendorId = part.VendorId,
            VendorName = part.Vendor?.Name ?? string.Empty
        };
    }
}