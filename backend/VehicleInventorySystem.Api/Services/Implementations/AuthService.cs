using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Services.Implementations;

public class AuthService : IAuthService
{
    private const int OtpExpiryMinutes = 10;
    private readonly UserManager<User> _userManager;
    private readonly IEmailService _emailService;

    public AuthService(UserManager<User> userManager, IEmailService emailService)
    {
        _userManager = userManager;
        _emailService = emailService;
    }

    public async Task<GenericResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.EmailAddress))
        {
            throw new ArgumentException("Email address is required.");
        }

        var normalizedEmail = request.EmailAddress.Trim().ToLowerInvariant();
        var user = await _userManager.FindByEmailAsync(normalizedEmail);

        if (user != null)
        {
            var otp = GenerateOtp();
            user.ResetOtp = otp;
            user.ResetOtpExpiry = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes);

            await _userManager.UpdateAsync(user);

            var subject = "Password Reset OTP";
            var body = $"Your OTP for password reset is: {otp}\nThis OTP will expire in 10 minutes.";
            await _emailService.SendEmailAsync(user.Email ?? request.EmailAddress, subject, body);
        }

        return new GenericResponse
        {
            Success = true,
            Message = "If an account exists with this email, an OTP has been sent.",
            StatusCode = 200
        };
    }

    public async Task<GenericResponse> VerifyOtpAsync(VerifyOtpRequest request)
    {
        ValidateOtpInput(request.EmailAddress, request.Otp);

        var user = await _userManager.FindByEmailAsync(request.EmailAddress.Trim().ToLowerInvariant());
        if (user == null || string.IsNullOrWhiteSpace(user.ResetOtp))
        {
            throw new InvalidOperationException("Invalid OTP.");
        }

        if (!IsOtpValid(user, request.Otp))
        {
            throw new InvalidOperationException("Invalid OTP.");
        }

        if (user.ResetOtpExpiry == null || user.ResetOtpExpiry < DateTime.UtcNow)
        {
            throw new InvalidOperationException("OTP has expired.");
        }

        return new GenericResponse
        {
            Success = true,
            Message = "OTP verified successfully.",
            StatusCode = 200
        };
    }

    public async Task<GenericResponse> ResetPasswordAsync(ResetPasswordRequest request)
    {
        ValidateResetInput(request);

        var user = await _userManager.FindByEmailAsync(request.EmailAddress.Trim().ToLowerInvariant());
        if (user == null || string.IsNullOrWhiteSpace(user.ResetOtp))
        {
            throw new InvalidOperationException("Invalid OTP.");
        }

        if (!IsOtpValid(user, request.Otp))
        {
            throw new InvalidOperationException("Invalid OTP.");
        }

        if (user.ResetOtpExpiry == null || user.ResetOtpExpiry < DateTime.UtcNow)
        {
            throw new InvalidOperationException("OTP has expired.");
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword.Trim());
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException(errors);
        }

        user.ResetOtp = null;
        user.ResetOtpExpiry = null;
        await _userManager.UpdateAsync(user);

        return new GenericResponse
        {
            Success = true,
            Message = "Password reset successfully.",
            StatusCode = 200
        };
    }

    private static string GenerateOtp()
    {
        var value = RandomNumberGenerator.GetInt32(0, 1000000);
        return value.ToString("D6");
    }

    private static void ValidateOtpInput(string emailAddress, string otp)
    {
        if (string.IsNullOrWhiteSpace(emailAddress))
        {
            throw new ArgumentException("Email address is required.");
        }

        if (string.IsNullOrWhiteSpace(otp))
        {
            throw new ArgumentException("OTP is required.");
        }
    }

    private static void ValidateResetInput(ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.EmailAddress))
        {
            throw new ArgumentException("Email address is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Otp))
        {
            throw new ArgumentException("OTP is required.");
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            throw new ArgumentException("New password is required.");
        }

        if (request.NewPassword.Trim().Length < 6)
        {
            throw new ArgumentException("Password must be at least 6 characters.");
        }

        if (string.IsNullOrWhiteSpace(request.ConfirmPassword))
        {
            throw new ArgumentException("Confirm password is required.");
        }

        if (!string.Equals(request.NewPassword.Trim(), request.ConfirmPassword.Trim(), StringComparison.Ordinal))
        {
            throw new ArgumentException("Passwords do not match.");
        }
    }

    private static bool IsOtpValid(User user, string otp)
    {
        return string.Equals(user.ResetOtp, otp.Trim(), StringComparison.Ordinal);
    }
}
