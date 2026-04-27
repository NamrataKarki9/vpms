using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;

namespace VehicleInventorySystem.Api.Services.Interfaces;

public interface IVendorService
{
    Task<List<VendorResponse>> GetAllVendorsAsync();
    Task<PaginatedResponse<VendorResponse>> GetVendorsPagedAsync(VendorQueryRequest request);
    Task<VendorResponse> GetVendorByIdAsync(int id);
    Task<VendorResponse> CreateVendorAsync(CreateVendorRequest request);
    Task<VendorResponse> UpdateVendorAsync(int id, UpdateVendorRequest request);
    Task<VendorResponse> DeactivateVendorAsync(int id);
    Task<VendorResponse> ToggleVendorStatusAsync(int id);
}
