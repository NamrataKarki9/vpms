using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;

namespace VehicleInventorySystem.Api.Services.Interfaces;

public interface IAuthService
{
    Task<GenericResponse> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<GenericResponse> VerifyOtpAsync(VerifyOtpRequest request);
    Task<GenericResponse> ResetPasswordAsync(ResetPasswordRequest request);
}
