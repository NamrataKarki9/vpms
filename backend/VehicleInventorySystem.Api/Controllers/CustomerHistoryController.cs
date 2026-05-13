using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.DTOs.Response;
using VehicleInventorySystem.Api.Models;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/customer")]
[Authorize]
public class CustomerHistoryController : ControllerBase
{
    private readonly AppDbContext _context;

    public CustomerHistoryController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get vehicles for a customer
    /// </summary>
    [HttpGet("{customerId}/vehicles")]
    public async Task<ActionResult<List<VehicleResponse>>> GetCustomerVehicles(int customerId)
    {
        var vehicles = await _context.Vehicles
            .Where(v => v.CustomerId == customerId)
            .OrderBy(v => v.PlateNumber)
            .Select(v => new VehicleResponse
            {
                Id = v.Id,
                PlateNumber = v.PlateNumber,
                Model = v.Model,
                Make = v.Make,
                Year = v.Year,
                FuelType = v.FuelType,
                Mileage = v.Mileage
            })
            .ToListAsync();

        return Ok(vehicles);
    }

    /// <summary>
    /// Get purchase history for a customer
    /// </summary>
    [HttpGet("{customerId}/purchase-history")]
    public async Task<ActionResult<List<PurchaseHistoryResponse>>> GetPurchaseHistory(int customerId)
    {
        var purchaseHistory = await _context.Invoices
            .Include(i => i.Items)
            .ThenInclude(ii => ii.Part)
            .Include(i => i.Vehicle)
            .Where(i => i.Type == InvoiceType.Sale && i.CustomerId == customerId)
            .OrderByDescending(i => i.Date)
            .Select(i => new PurchaseHistoryResponse
            {
                Id = i.Id,
                InvoiceNumber = $"INV-{i.Id:D6}",
                PurchaseDate = i.Date,
                VehicleId = i.VehicleId ?? 0,
                VehicleNumber = i.Vehicle != null ? i.Vehicle.PlateNumber : "N/A",
                VehicleModel = i.Vehicle != null ? $"{i.Vehicle.Make} {i.Vehicle.Model}" : "Unknown Vehicle",
                PurchasedParts = string.Join(", ", i.Items.Select(ii => ii.Part!.Name)),
                TotalAmount = i.TotalAmount,
                PaymentStatus = i.PaymentStatus ?? "Unknown"
            })
            .ToListAsync();

        return Ok(purchaseHistory);
    }

    /// <summary>
    /// Get service history for a customer
    /// </summary>
    [HttpGet("{customerId}/service-history")]
    public async Task<ActionResult<List<ServiceHistoryResponse>>> GetServiceHistory(int customerId)
    {
        var serviceHistory = await _context.Appointments
            .Include(a => a.Vehicle)
            .Where(a => a.CustomerId == customerId && a.Status == AppointmentStatus.Completed)
            .OrderByDescending(a => a.AppointmentDate)
            .Select(a => new ServiceHistoryResponse
            {
                Id = a.Id,
                ServiceDate = a.AppointmentDate,
                VehicleId = a.VehicleId,
                VehicleNumber = a.Vehicle!.PlateNumber,
                VehicleModel = $"{a.Vehicle!.Make} {a.Vehicle!.Model}",
                ServiceType = a.ServiceType,
                Description = a.Description,
                Status = a.Status.ToString(),
                Cost = a.Cost
            })
            .ToListAsync();

        return Ok(serviceHistory);
    }
}
