using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Services.Implementations;

public class VendorService : IVendorService
{
    private readonly AppDbContext _context;

    public VendorService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<VendorResponse>> GetAllVendorsAsync()
    {
        var vendors = await _context.Vendors
            .AsNoTracking()
            .OrderBy(v => v.Name)
            .ToListAsync();

        return vendors.Select(MapToResponse).ToList();
    }

    public async Task<PaginatedResponse<VendorResponse>> GetVendorsPagedAsync(VendorQueryRequest request)
    {
        var normalizedRequest = NormalizeQueryRequest(request);
        var query = ApplyVendorFilters(_context.Vendors.AsNoTracking(), normalizedRequest);

        var totalItems = await query.CountAsync();
        var totalPages = totalItems == 0 ? 1 : (int)Math.Ceiling(totalItems / (double)normalizedRequest.PageSize);
        if (normalizedRequest.PageNumber > totalPages)
        {
            normalizedRequest.PageNumber = totalPages;
        }

        var skip = (normalizedRequest.PageNumber - 1) * normalizedRequest.PageSize;

        var items = await query
            .OrderBy(v => v.Name)
            .Skip(skip)
            .Take(normalizedRequest.PageSize)
            .ToListAsync();

        return new PaginatedResponse<VendorResponse>
        {
            Items = items.Select(MapToResponse).ToList(),
            PageNumber = normalizedRequest.PageNumber,
            PageSize = normalizedRequest.PageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
            HasNextPage = normalizedRequest.PageNumber < totalPages,
            HasPreviousPage = normalizedRequest.PageNumber > 1
        };
    }

    public async Task<VendorResponse> GetVendorByIdAsync(int id)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid input: vendor id must be greater than zero.");
        }

        var vendor = await _context.Vendors
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vendor == null)
        {
            throw new KeyNotFoundException("Vendor not found.");
        }

        return MapToResponse(vendor);
    }

    public async Task<VendorResponse> CreateVendorAsync(CreateVendorRequest request)
    {
        ValidateVendorInput(request.Name, request.ContactPerson, request.PhoneNumber, request.EmailAddress, request.Address);

        var normalizedName = request.Name.Trim().ToLowerInvariant();
        var normalizedPhone = request.PhoneNumber.Trim().ToLowerInvariant();
        var normalizedEmail = request.EmailAddress.Trim().ToLowerInvariant();

        var emailExists = await _context.Vendors.AnyAsync(v => v.EmailAddress.ToLower() == normalizedEmail);
        var phoneExists = await _context.Vendors.AnyAsync(v => v.PhoneNumber.ToLower() == normalizedPhone);
        var nameExists = await _context.Vendors.AnyAsync(v => v.Name.ToLower() == normalizedName);

        if (emailExists && phoneExists)
        {
            throw new InvalidOperationException("Vendor with this email or phone number already exists.");
        }

        if (emailExists)
        {
            throw new InvalidOperationException("Email address already exists.");
        }

        if (phoneExists)
        {
            throw new InvalidOperationException("Phone number already exists.");
        }

        if (nameExists)
        {
            throw new InvalidOperationException("Vendor name already exists.");
        }

        var vendor = new Vendor
        {
            Name = request.Name.Trim(),
            ContactPerson = request.ContactPerson.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            EmailAddress = request.EmailAddress.Trim(),
            Address = request.Address.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null
        };

        _context.Vendors.Add(vendor);
        await _context.SaveChangesAsync();

        return MapToResponse(vendor);
    }

    public async Task<VendorResponse> UpdateVendorAsync(int id, UpdateVendorRequest request)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid input: vendor id must be greater than zero.");
        }

        ValidateVendorInput(request.Name, request.ContactPerson, request.PhoneNumber, request.EmailAddress, request.Address);

        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.Id == id);
        if (vendor == null)
        {
            throw new KeyNotFoundException("Vendor not found.");
        }

        var normalizedName = request.Name.Trim().ToLowerInvariant();
        var normalizedPhone = request.PhoneNumber.Trim().ToLowerInvariant();
        var normalizedEmail = request.EmailAddress.Trim().ToLowerInvariant();

        var emailExists = await _context.Vendors.AnyAsync(v =>
            v.Id != id && v.EmailAddress.ToLower() == normalizedEmail);
        var phoneExists = await _context.Vendors.AnyAsync(v =>
            v.Id != id && v.PhoneNumber.ToLower() == normalizedPhone);
        var nameExists = await _context.Vendors.AnyAsync(v =>
            v.Id != id && v.Name.ToLower() == normalizedName);

        if (emailExists && phoneExists)
        {
            throw new InvalidOperationException("Vendor with this email or phone number already exists.");
        }

        if (emailExists)
        {
            throw new InvalidOperationException("Email address already exists.");
        }

        if (phoneExists)
        {
            throw new InvalidOperationException("Phone number already exists.");
        }

        if (nameExists)
        {
            throw new InvalidOperationException("Vendor name already exists.");
        }

        vendor.Name = request.Name.Trim();
        vendor.ContactPerson = request.ContactPerson.Trim();
        vendor.PhoneNumber = request.PhoneNumber.Trim();
        vendor.EmailAddress = request.EmailAddress.Trim();
        vendor.Address = request.Address.Trim();
        vendor.IsActive = request.IsActive;
        vendor.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(vendor);
    }

    public async Task<VendorResponse> DeactivateVendorAsync(int id)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid input: vendor id must be greater than zero.");
        }

        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.Id == id);
        if (vendor == null)
        {
            throw new KeyNotFoundException("Vendor not found.");
        }

        if (vendor.IsActive)
        {
            vendor.IsActive = false;
            vendor.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return MapToResponse(vendor);
    }

    public async Task<VendorResponse> ToggleVendorStatusAsync(int id)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid input: vendor id must be greater than zero.");
        }

        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.Id == id);
        if (vendor == null)
        {
            throw new KeyNotFoundException("Vendor not found.");
        }

        vendor.IsActive = !vendor.IsActive;
        vendor.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToResponse(vendor);
    }

    private static void ValidateVendorInput(string name, string contactPerson, string phoneNumber, string emailAddress, string address)
    {
        if (string.IsNullOrWhiteSpace(name) ||
            string.IsNullOrWhiteSpace(contactPerson) ||
            string.IsNullOrWhiteSpace(phoneNumber) ||
            string.IsNullOrWhiteSpace(emailAddress) ||
            string.IsNullOrWhiteSpace(address))
        {
            throw new ArgumentException("Please fill in all required fields.");
        }
    }

    private static VendorQueryRequest NormalizeQueryRequest(VendorQueryRequest? request)
    {
        var normalizedRequest = request ?? new VendorQueryRequest();
        normalizedRequest.PageNumber = normalizedRequest.PageNumber < 1 ? 1 : normalizedRequest.PageNumber;
        normalizedRequest.PageSize = normalizedRequest.PageSize is 5 or 10 or 15 ? normalizedRequest.PageSize : 5;
        normalizedRequest.SearchTerm = string.IsNullOrWhiteSpace(normalizedRequest.SearchTerm)
            ? null
            : normalizedRequest.SearchTerm.Trim().ToLowerInvariant();
        normalizedRequest.Status = NormalizeStatus(normalizedRequest.Status);

        return normalizedRequest;
    }

    private static string NormalizeStatus(string? status)
    {
        var normalizedStatus = status?.Trim().ToLowerInvariant();

        return normalizedStatus switch
        {
            "active" => "active",
            "inactive" => "inactive",
            _ => "all"
        };
    }

    private static IQueryable<Vendor> ApplyVendorFilters(IQueryable<Vendor> query, VendorQueryRequest request)
    {
        query = ApplySearchFilter(query, request.SearchTerm);
        query = ApplyStatusFilter(query, request.Status);

        return query;
    }

    private static IQueryable<Vendor> ApplySearchFilter(IQueryable<Vendor> query, string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return query;
        }

        return query.Where(v =>
            v.Name.ToLower().Contains(searchTerm) ||
            v.ContactPerson.ToLower().Contains(searchTerm) ||
            v.PhoneNumber.ToLower().Contains(searchTerm) ||
            v.EmailAddress.ToLower().Contains(searchTerm) ||
            v.Address.ToLower().Contains(searchTerm));
    }

    private static IQueryable<Vendor> ApplyStatusFilter(IQueryable<Vendor> query, string? status)
    {
        return status switch
        {
            "active" => query.Where(v => v.IsActive),
            "inactive" => query.Where(v => !v.IsActive),
            _ => query
        };
    }

    private static VendorResponse MapToResponse(Vendor vendor)
    {
        return new VendorResponse
        {
            Id = vendor.Id,
            Name = vendor.Name,
            ContactPerson = vendor.ContactPerson,
            PhoneNumber = vendor.PhoneNumber,
            EmailAddress = vendor.EmailAddress,
            Address = vendor.Address,
            IsActive = vendor.IsActive,
            CreatedAt = vendor.CreatedAt,
            UpdatedAt = vendor.UpdatedAt
        };
    }
}
