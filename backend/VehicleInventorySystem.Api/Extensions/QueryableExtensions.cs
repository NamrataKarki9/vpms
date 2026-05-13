using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.DTOs.Response;

namespace VehicleInventorySystem.Api.Extensions;

public static class QueryableExtensions
{
    public static async Task<PaginatedResponse<T>> ToPaginatedResponseAsync<T>(
        this IQueryable<T> query, 
        int pageNumber, 
        int pageSize)
    {
        var totalItems = await query.CountAsync();
        
        // Ensure page number is at least 1
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        // Ensure page size is at least 1
        pageSize = pageSize < 1 ? 10 : pageSize;

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        return new PaginatedResponse<T>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
            HasNextPage = pageNumber < totalPages,
            HasPreviousPage = pageNumber > 1
        };
    }
}
