using VehicleInventorySystem.Api.DTOs.Response;

namespace VehicleInventorySystem.Api.Services.Interfaces;

public interface INotificationService
{
    Task EnsureNotificationAsync(string notificationKey, string role, string title, string message, int? userId = null);

    Task SyncLowStockNotificationsAsync();

    Task SyncOverduePaymentNotificationsAsync();

    Task<IReadOnlyList<NotificationResponse>> GetNotificationsAsync(string? role, int? userId);

    Task<bool> MarkAsReadAsync(int notificationId, string? role, int? userId);

    Task<int> MarkAllAsReadAsync(string? role, int? userId);
}