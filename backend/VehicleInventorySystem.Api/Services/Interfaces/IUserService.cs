using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;
using VehicleInventorySystem.Api.Models;

namespace VehicleInventorySystem.Api.Services.Interfaces;

public interface IUserService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<UserResponse> CreateCustomerAsync(CreateCustomerRequest request);
    Task<List<UserResponse>> GetAllUsersAsync(UserRole? role);
    Task<List<UserResponse>> GetAllStaffAsync();
    Task<UserResponse> GetUserByIdAsync(int id);
    Task<UserResponse> CreateStaffAsync(CreateStaffRequest request);
    Task<UserResponse> UpdateUserAsync(int id, UpdateUserRequest request);
    Task<UserResponse> ToggleUserStatusAsync(int id);
    Task<PaginatedResponse<UserResponse>> GetPaginatedUsersAsync(UserRole? role, PaginationRequest pagination);
}
