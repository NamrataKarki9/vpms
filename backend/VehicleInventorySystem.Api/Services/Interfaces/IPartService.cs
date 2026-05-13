using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;

namespace VehicleInventorySystem.Api.Services.Interfaces;

public interface IPartService
{
    Task<List<PartResponse>> GetAllPartsAsync();

    Task<PartResponse?> GetPartByIdAsync(int id);

    Task<PartResponse> CreatePartAsync(CreatePartRequest request);

    Task<PartResponse> UpdatePartAsync(int id, UpdatePartRequest request);

    Task<PartResponse> TogglePartStatusAsync(int id);

    Task<PaginatedResponse<PartResponse>> GetPaginatedPartsAsync(PaginationRequest pagination);
}