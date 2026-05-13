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
    private readonly ILogger<AuthService> _logger;

    public AuthService(UserManager<User> userManager, IEmailService emailService, ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<GenericResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        _logger.LogInformation("Forgot password request received for email: {Email}", request.EmailAddress);

        if (string.IsNullOrWhiteSpace(request.EmailAddress))
        {
            _logger.LogWarning("Forgot password request with empty email address.");
            throw new ArgumentException("Email address is required.");
        }

        var normalizedEmail = request.EmailAddress.Trim().ToLowerInvariant();
        _logger.LogInformation("Looking up user with normalized email: {NormalizedEmail}", normalizedEmail);

        var user = await _userManager.FindByEmailAsync(normalizedEmail);

        if (user != null)
        {
            _logger.LogInformation("User found: {UserId}. Generating OTP and sending email.", user.Id);

            try
            {
                var otp = GenerateOtp();
                _logger.LogInformation("Generated OTP for user {UserId}: {Otp}", user.Id, otp);

                user.ResetOtp = otp;
                user.ResetOtpExpiry = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes);

                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                    _logger.LogError("Failed to save OTP to database for user {UserId}: {Errors}", user.Id, errors);
                    throw new InvalidOperationException($"Failed to save OTP: {errors}");
                }

                _logger.LogInformation("OTP saved. Sending email to: {Email}", user.Email);

                var subject = "Password Reset OTP";
                var body = $"Your OTP for password reset is: {otp}\nThis OTP will expire in 10 minutes.";
                await _emailService.SendEmailAsync(user.Email ?? request.EmailAddress, subject, body);

                _logger.LogInformation("Password reset email sent successfully to user {UserId}", user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending forgot password email for user {UserId}: {Message}", user.Id, ex.Message);
                throw;
            }
        }
        else
        {
            _logger.LogInformation("User not found with email: {NormalizedEmail}. Returning generic success for security.", normalizedEmail);
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
        _logger.LogInformation("OTP verification request for email: {Email}", request.EmailAddress);
        ValidateOtpInput(request.EmailAddress, request.Otp);

        var user = await _userManager.FindByEmailAsync(request.EmailAddress.Trim().ToLowerInvariant());
        if (user == null || string.IsNullOrWhiteSpace(user.ResetOtp))
        {
            _logger.LogWarning("OTP verification failed: User not found or no OTP set for email: {Email}", request.EmailAddress);
            throw new InvalidOperationException("Invalid OTP.");
        }

        if (!IsOtpValid(user, request.Otp))
        {
            _logger.LogWarning("OTP verification failed: Invalid OTP for user {UserId}", user.Id);
            throw new InvalidOperationException("Invalid OTP.");
        }

        if (user.ResetOtpExpiry == null || user.ResetOtpExpiry < DateTime.UtcNow)
        {
            _logger.LogWarning("OTP verification failed: OTP expired for user {UserId}", user.Id);
            throw new InvalidOperationException("OTP has expired.");
        }

        _logger.LogInformation("OTP verified successfully for user {UserId}", user.Id);
        return new GenericResponse
        {
            Success = true,
            Message = "OTP verified successfully.",
            StatusCode = 200
        };
    }

    public async Task<GenericResponse> ResetPasswordAsync(ResetPasswordRequest request)
    {
        _logger.LogInformation("Password reset request for email: {Email}", request.EmailAddress);
        ValidateResetInput(request);

        var user = await _userManager.FindByEmailAsync(request.EmailAddress.Trim().ToLowerInvariant());
        if (user == null || string.IsNullOrWhiteSpace(user.ResetOtp))
        {
            _logger.LogWarning("Password reset failed: User not found or no OTP set for email: {Email}", request.EmailAddress);
            throw new InvalidOperationException("Invalid OTP.");
        }

        if (!IsOtpValid(user, request.Otp))
        {
            _logger.LogWarning("Password reset failed: Invalid OTP for user {UserId}", user.Id);
            throw new InvalidOperationException("Invalid OTP.");
        }

        if (user.ResetOtpExpiry == null || user.ResetOtpExpiry < DateTime.UtcNow)
        {
            _logger.LogWarning("Password reset failed: OTP expired for user {UserId}", user.Id);
            throw new InvalidOperationException("OTP has expired.");
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword.Trim());
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            _logger.LogError("Password reset failed for user {UserId}: {Errors}", user.Id, errors);
            throw new InvalidOperationException(errors);
        }

        user.ResetOtp = null;
        user.ResetOtpExpiry = null;
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("Password reset successfully for user {UserId}", user.Id);
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
