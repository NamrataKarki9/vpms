using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.DTOs.Response;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Services.Implementations;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task EnsureNotificationAsync(string notificationKey, string role, string title, string message, int? userId = null)
    {
        var existing = await _context.Notifications.FirstOrDefaultAsync(n => n.NotificationKey == notificationKey);
        if (existing == null)
        {
            _context.Notifications.Add(new SystemNotification
            {
                NotificationKey = notificationKey,
                Role = role,
                UserId = userId,
                Title = title,
                Message = message,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            });
            return;
        }

        existing.Role = role;
        existing.UserId = userId;
        existing.Title = title;
        existing.Message = message;
        // Do not overwrite CreatedAt on updates — keep original creation time
    }

    public async Task SyncLowStockNotificationsAsync()
    {
        var lowStockParts = await _context.Parts
            .AsNoTracking()
            .Where(part => part.StockLevel < 10)
            .Select(part => new { part.Id, part.Name, part.StockLevel })
            .ToListAsync();

        foreach (var part in lowStockParts)
        {
            await EnsureNotificationAsync(
                $"low-stock-admin-{part.Id}",
                "Admin",
                "Low Stock Alert",
                $"{part.Name} is low in stock. Only {part.StockLevel} units left.");
        }
    }

    public async Task SyncOverduePaymentNotificationsAsync()
    {
        var cutoffDate = DateTime.UtcNow.AddMonths(-1);

        var overdueCustomers = await _context.Invoices
            .AsNoTracking()
            .Include(invoice => invoice.Customer)
            .Where(invoice => invoice.CustomerId.HasValue && invoice.Date < cutoffDate && !invoice.IsPaid)
            .Select(invoice => new
            {
                invoice.Id,
                invoice.CustomerId,
                CustomerName = invoice.Customer != null ? invoice.Customer.Name : "Customer",
                invoice.TotalAmount,
                invoice.PaymentStatus
            })
            .ToListAsync();

        var grouped = overdueCustomers
            .GroupBy(invoice => new { invoice.CustomerId, invoice.CustomerName })
            .Select(group => new OverdueSummary
            {
                CustomerId = group.Key.CustomerId,
                CustomerName = group.Key.CustomerName,
                Amount = group.Sum(invoice => EstimateOutstandingAmount(invoice.TotalAmount, invoice.PaymentStatus))
            })
            .Where(item => item.CustomerId.HasValue && item.Amount > 0)
            .ToList();

        foreach (var item in grouped)
        {
            await EnsureNotificationAsync(
                $"overdue-payment-{item.CustomerId}",
                "Admin",
                "Payment Overdue",
                $"{item.CustomerName} has an overdue payment of Rs. {item.Amount:0.##}.");

            await EnsureNotificationAsync(
                $"overdue-payment-staff-{item.CustomerId}",
                "Staff",
                "Payment Overdue",
                $"{item.CustomerName} has an overdue payment of Rs. {item.Amount:0.##}.");
        }
    }

    private async Task SyncBookingNotificationsAsync()
    {
        var appointments = await _context.Appointments
            .AsNoTracking()
            .Include(appointment => appointment.Customer)
            .Include(appointment => appointment.Vehicle)
            .Where(appointment => appointment.Status == AppointmentStatus.Confirmed || appointment.Status == AppointmentStatus.Pending)
            .OrderByDescending(appointment => appointment.AppointmentDate)
            .Take(200)
            .ToListAsync();

        foreach (var appointment in appointments)
        {
            var customerName = appointment.Customer?.Name ?? "Customer";
            var vehicleName = appointment.Vehicle != null
                ? $"{appointment.Vehicle.Make} {appointment.Vehicle.Model}".Trim()
                : "Vehicle";
            var bookingDate = appointment.AppointmentDate.ToString("yyyy-MM-dd");
            var bookingTime = DateTime.Today.Add(appointment.AppointmentTime).ToString("h:mm tt");

            await EnsureNotificationAsync(
                $"booking-admin-{appointment.Id}",
                "Admin",
                "New Booking",
                $"New booking created by {customerName} for {vehicleName} on {bookingDate} at {bookingTime}.");

            await EnsureNotificationAsync(
                $"booking-staff-{appointment.Id}",
                "Staff",
                "New Booking",
                $"New booking created by {customerName} for {vehicleName} on {bookingDate} at {bookingTime}.");

            await EnsureNotificationAsync(
                $"booking-customer-{appointment.Id}",
                "Customer",
                "Booking Confirmed",
                $"Your booking for {appointment.ServiceType} for {vehicleName} on {bookingDate} at {bookingTime} has been confirmed.",
                appointment.CustomerId);
        }
    }

    public async Task<IReadOnlyList<NotificationResponse>> GetNotificationsAsync(string? role, int? userId)
    {
        if (!string.IsNullOrWhiteSpace(role))
        {
            if (role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            {
                await SyncBookingNotificationsAsync();
                await SyncLowStockNotificationsAsync();
                await SyncOverduePaymentNotificationsAsync();
            }
            else if (role.Equals("Staff", StringComparison.OrdinalIgnoreCase))
            {
                await SyncBookingNotificationsAsync();
                await SyncOverduePaymentNotificationsAsync();
            }
            else if (role.Equals("Customer", StringComparison.OrdinalIgnoreCase))
            {
                await SyncBookingNotificationsAsync();
            }
        }

        await _context.SaveChangesAsync();

        var query = _context.Notifications.AsNoTracking().AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(notification => notification.UserId == userId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(notification => notification.Role == role);
        }

        return await query
            .OrderByDescending(notification => notification.CreatedAt)
            .ThenByDescending(notification => notification.Id)
            .Select(notification => new NotificationResponse
            {
                Id = notification.Id,
                NotificationKey = notification.NotificationKey,
                Role = notification.Role,
                UserId = notification.UserId,
                Title = notification.Title,
                Message = notification.Message,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<bool> MarkAsReadAsync(int notificationId, string? role, int? userId)
    {
        var notification = await _context.Notifications.FirstOrDefaultAsync(item => item.Id == notificationId);
        if (notification == null)
        {
            return false;
        }

        if (!CanAccess(notification, role, userId))
        {
            return false;
        }

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> MarkAllAsReadAsync(string? role, int? userId)
    {
        var query = _context.Notifications.Where(notification => !notification.IsRead);

        if (userId.HasValue)
        {
            query = query.Where(notification => notification.UserId == userId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(notification => notification.Role == role);
        }

        var notifications = await query.ToListAsync();
        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        if (notifications.Count > 0)
        {
            await _context.SaveChangesAsync();
        }

        return notifications.Count;
    }

    private static decimal EstimateOutstandingAmount(decimal totalAmount, string? paymentStatus)
    {
        var normalizedStatus = string.IsNullOrWhiteSpace(paymentStatus)
            ? string.Empty
            : paymentStatus.Trim().ToLowerInvariant();

        return normalizedStatus switch
        {
            "full-payment" => 0m,
            "half-payment" => totalAmount * 0.5m,
            "partial-payment" => totalAmount * 0.9m,
            _ => totalAmount
        };
    }

    private sealed class OverdueSummary
    {
        public int? CustomerId { get; set; }

        public string CustomerName { get; set; } = string.Empty;

        public decimal Amount { get; set; }
    }

    private static bool CanAccess(SystemNotification notification, string? role, int? userId)
    {
        if (userId.HasValue && notification.UserId == userId.Value)
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(role) && string.Equals(notification.Role, role, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }
}