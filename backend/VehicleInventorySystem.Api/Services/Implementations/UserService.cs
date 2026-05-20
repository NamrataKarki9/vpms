using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using VehicleInventorySystem.Api.Configuration;
using VehicleInventorySystem.Api.Data;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.DTOs.Response;
using VehicleInventorySystem.Api.Models;
using VehicleInventorySystem.Api.Services.Interfaces;
using VehicleInventorySystem.Api.Extensions;

namespace VehicleInventorySystem.Api.Services.Implementations;

public class UserService : IUserService
{
    private readonly UserManager<User> _userManager;
    private readonly AppDbContext _context;
    private readonly JwtSettings _jwtSettings;

    public UserService(UserManager<User> userManager, AppDbContext context, IOptions<JwtSettings> jwtOptions)
    {
        _userManager = userManager;
        _context = context;
        _jwtSettings = jwtOptions.Value;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ArgumentException("Email address is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Password is required.");
        }

        var user = await _userManager.FindByEmailAsync(request.Email.Trim());
        if (user == null)
        {
            throw new InvalidOperationException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new InvalidOperationException("Your account is inactive. Please contact admin.");
        }

        var isValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isValid)
        {
            throw new InvalidOperationException("Invalid email or password.");
        }

        return new LoginResponse
        {
            Token = GenerateJwtToken(user),
            Id = user.Id,
            FullName = user.Name,
            EmailAddress = user.Email ?? string.Empty,
            Role = user.Role.ToString()
        };
    }

    public async Task<UserResponse> CreateCustomerAsync(CreateCustomerRequest request)
    {
        ValidateCustomerInput(request.Name, request.Email, request.PhoneNumber, request.Password, request.ConfirmPassword);

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var emailExists = await _userManager.FindByEmailAsync(normalizedEmail) != null;
        if (emailExists)
        {
            throw new InvalidOperationException("Email already registered. Please use a different email or login.");
        }

        var normalizedPhone = request.PhoneNumber.Trim();
        var phoneExists = await _context.Users.AnyAsync(u => u.PhoneNumber != null && u.PhoneNumber == normalizedPhone);
        if (phoneExists)
        {
            throw new InvalidOperationException("Phone number already registered.");
        }

        var user = new User
        {
            UserName = request.Email.Trim(),
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            Role = UserRole.Customer,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Registration failed: {errors}");
        }

        await EnsureUserRoleAssignmentAsync(user, UserRole.Customer);

        if (request.Vehicles != null && request.Vehicles.Count > 0)
        {
            foreach (var vehicleDto in request.Vehicles)
            {
                var vehicle = new Vehicle
                {
                    CustomerId = user.Id,
                    PlateNumber = vehicleDto.PlateNumber ?? string.Empty,
                    Model = vehicleDto.Model ?? string.Empty,
                    Make = vehicleDto.Make ?? string.Empty,
                    Year = vehicleDto.Year,
                    FuelType = vehicleDto.FuelType?.Trim(),
                    Mileage = vehicleDto.Mileage
                };
                _context.Vehicles.Add(vehicle);
            }
            await _context.SaveChangesAsync();
        }

        return MapToResponse(user);
    }

    public async Task<List<UserResponse>> GetAllUsersAsync(UserRole? role)
    {
        var query = _context.Users.AsNoTracking().Include(u => u.Vehicles).AsQueryable();

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        var users = await query
            .Where(u => u.IsActive)
            .OrderBy(u => u.Name)
            .ToListAsync();

        return users.Select(MapToResponse).ToList();
    }

    public async Task<List<UserResponse>> GetAllStaffAsync()
    {
        var staff = await _context.Users
            .AsNoTracking()
            .Include(u => u.Vehicles)
            .Where(u => u.Role == UserRole.Staff && u.IsActive)
            .OrderBy(u => u.Name)
            .ToListAsync();

        return staff.Select(MapToResponse).ToList();
    }

    public async Task<PaginatedResponse<UserResponse>> GetPaginatedUsersAsync(UserRole? role, PaginationRequest pagination)
    {
        var query = _context.Users.AsNoTracking().Include(u => u.Vehicles).AsQueryable();

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        var pagedData = await query
            .Where(u => u.IsActive)
            .OrderBy(u => u.Name)
            .ToPaginatedResponseAsync(pagination.PageNumber, pagination.PageSize);

        return new PaginatedResponse<UserResponse>
        {
            Items = pagedData.Items.Select(MapToResponse).ToList(),
            PageNumber = pagedData.PageNumber,
            PageSize = pagedData.PageSize,
            TotalItems = pagedData.TotalItems,
            TotalPages = pagedData.TotalPages,
            HasNextPage = pagedData.HasNextPage,
            HasPreviousPage = pagedData.HasPreviousPage
        };
    }

    public async Task<UserResponse> GetUserByIdAsync(int id)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid input: user id must be greater than zero.");
        }

        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Vehicles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        return MapToResponse(user);
    }

    public async Task<UserResponse> CreateStaffAsync(CreateStaffRequest request)
    {
        var fullName = request.ResolvedFullName;
        var emailAddress = request.ResolvedEmailAddress;
        var phoneNumber = request.ResolvedPhoneNumber;
        var password = request.Password?.Trim() ?? string.Empty;
        var confirmPassword = request.ResolvedConfirmPassword;

        ValidateStaffInput(fullName, emailAddress, phoneNumber, password, confirmPassword);

        var normalizedEmail = emailAddress.ToLowerInvariant();
        var emailExists = await _userManager.FindByEmailAsync(normalizedEmail) != null;
        if (emailExists)
        {
            throw new InvalidOperationException("Email already registered. Please use a different email.");
        }

        var normalizedPhone = phoneNumber;
        var phoneExists = await _context.Users.AnyAsync(u => u.PhoneNumber != null && u.PhoneNumber == normalizedPhone);
        if (phoneExists)
        {
            throw new InvalidOperationException("Phone number already registered.");
        }

        var user = new User
        {
            UserName = emailAddress,
            Name = fullName,
            Email = emailAddress,
            PhoneNumber = phoneNumber,
            Role = UserRole.Staff,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Staff creation failed: {errors}");
        }

        await EnsureUserRoleAssignmentAsync(user, UserRole.Staff);

        return MapToResponse(user);
    }

    public async Task<UserResponse> UpdateUserAsync(int id, UpdateUserRequest request)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid input: user id must be greater than zero.");
        }

        ValidateUpdateInput(request.Name, request.Email);

        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (!string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            var emailExists = await _userManager.FindByEmailAsync(normalizedEmail) != null;
            if (emailExists)
            {
                throw new InvalidOperationException("Email already exists.");
            }
        }

        if (request.PhoneNumber != null)
        {
            var normalizedPhone = request.PhoneNumber.Trim();
            var phoneExists = await _context.Users.AnyAsync(u =>
                u.Id != id && u.PhoneNumber != null && u.PhoneNumber == normalizedPhone);
            if (phoneExists)
            {
                throw new InvalidOperationException("Phone number already exists.");
            }
            user.PhoneNumber = normalizedPhone;
        }

        if (!string.IsNullOrEmpty(request.Password))
        {
            var trimmedPassword = request.Password.Trim();
            if (trimmedPassword.Length < 8)
            {
                throw new ArgumentException("Password must be at least 8 characters.");
            }
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await _userManager.ResetPasswordAsync(user, token, trimmedPassword);
            if (!resetResult.Succeeded)
            {
                var errors = string.Join(" ", resetResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Password update failed: {errors}");
            }
        }

        user.UserName = request.Email.Trim();
        user.Name = request.Name.Trim();
        user.Email = request.Email.Trim();

        if (!string.IsNullOrEmpty(request.Role) && Enum.TryParse<UserRole>(request.Role, true, out var parsedRole))
        {
            user.Role = parsedRole;
        }

        if (request.IsActive.HasValue)
        {
            user.IsActive = request.IsActive.Value;
        }

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var errors = string.Join(" ", updateResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Update failed: {errors}");
        }

        await EnsureUserRoleAssignmentAsync(user, user.Role);

        return MapToResponse(user);
    }

    public async Task<UserResponse> ToggleUserStatusAsync(int id)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid input: user id must be greater than zero.");
        }

        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        if (user.Role == UserRole.Admin)
        {
            throw new InvalidOperationException("Cannot deactivate admin accounts.");
        }

        user.IsActive = !user.IsActive;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var errors = string.Join(" ", updateResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Status update failed: {errors}");
        }

        return MapToResponse(user);
    }

    public async Task<object> DeleteUserAsync(int id)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid input: user id must be greater than zero.");
        }

        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        if (user.Role == UserRole.Admin)
        {
            throw new InvalidOperationException("Cannot delete admin accounts.");
        }

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Delete failed: {errors}");
        }

        return new { message = "User deleted successfully" };
    }

    public async Task<UserResponse> ChangePasswordAsync(int id, ChangePasswordRequest request)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid input: user id must be greater than zero.");
        }

        // Validate input
        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            throw new ArgumentException("Current password is required.");
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            throw new ArgumentException("New password is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ConfirmPassword))
        {
            throw new ArgumentException("Password confirmation is required.");
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            throw new ArgumentException("New password and confirmation password do not match.");
        }

        if (request.NewPassword.Length < 8)
        {
            throw new ArgumentException("New password must be at least 8 characters.");
        }

        // Find the user
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        // Verify current password
        var isCurrentPasswordValid = await _userManager.CheckPasswordAsync(user, request.CurrentPassword);
        if (!isCurrentPasswordValid)
        {
            throw new InvalidOperationException("Current password is incorrect.");
        }

        // Generate password reset token and reset the password
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

        if (!resetResult.Succeeded)
        {
            var errors = string.Join(" ", resetResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Password change failed: {errors}");
        }

        return MapToResponse(user);
    }

    private static void ValidateCustomerInput(string name, string email, string phoneNumber, string password, string confirmPassword)
    {
        // Check for null or whitespace
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Name is required.");
        }

        var trimmedName = name.Trim();
        if (trimmedName.Length < 2)
        {
            throw new ArgumentException("Name must be at least 2 characters.");
        }

        if (trimmedName.Length > 100)
        {
            throw new ArgumentException("Name must not exceed 100 characters.");
        }

        // Email validation
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email address is required.");
        }

        var trimmedEmail = email.Trim();
        if (trimmedEmail.Length > 256)
        {
            throw new ArgumentException("Email address must not exceed 256 characters.");
        }

        // RFC 5322 compliant email validation pattern
        var emailPattern = @"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$";
        if (!Regex.IsMatch(trimmedEmail, emailPattern))
        {
            throw new ArgumentException("Invalid email format. Please enter a valid email address.");
        }

        // Phone number validation - numbers only, exactly 10 digits
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            throw new ArgumentException("Phone number is required.");
        }

        var trimmedPhone = phoneNumber.Trim();
        
        // Check if phone contains only digits
        if (!Regex.IsMatch(trimmedPhone, @"^\d+$"))
        {
            throw new ArgumentException("Phone number must contain only numbers.");
        }

        // Check if phone is exactly 10 digits
        if (trimmedPhone.Length != 10)
        {
            throw new ArgumentException("Phone number must be exactly 10 digits.");
        }

        // Password validation
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Password is required.");
        }

        var trimmedPassword = password.Trim();
        if (trimmedPassword.Length < 8)
        {
            throw new ArgumentException("Password must be at least 8 characters.");
        }

        if (trimmedPassword.Length > 128)
        {
            throw new ArgumentException("Password must not exceed 128 characters.");
        }

        if (!Regex.IsMatch(trimmedPassword, @"[A-Z]"))
        {
            throw new ArgumentException("Password must contain at least one uppercase letter.");
        }

        if (!Regex.IsMatch(trimmedPassword, @"[a-z]"))
        {
            throw new ArgumentException("Password must contain at least one lowercase letter.");
        }

        if (!Regex.IsMatch(trimmedPassword, @"\d"))
        {
            throw new ArgumentException("Password must contain at least one numeric digit.");
        }

        if (!Regex.IsMatch(trimmedPassword, @"[!@#$%^&*()_+\-=\[\]{};':""`~,.<>?/\\|]"))
        {
            throw new ArgumentException("Password must contain at least one special character (!@#$%^&*()_+-=[]{}';:\"` etc.).");
        }

        // Confirm password match
        if (string.IsNullOrWhiteSpace(confirmPassword))
        {
            throw new ArgumentException("Confirm password is required.");
        }

        if (!string.Equals(trimmedPassword, confirmPassword.Trim(), StringComparison.Ordinal))
        {
            throw new ArgumentException("Passwords do not match.");
        }
    }

    private static void ValidateStaffInput(string fullName, string emailAddress, string phoneNumber, string password, string confirmPassword)
    {
        // Check for null or whitespace
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException("Full name is required.");
        }

        // Full Name validation
        var trimmedName = fullName.Trim();
        if (trimmedName.Length < 2)
        {
            throw new ArgumentException("Full name must be at least 2 characters.");
        }

        if (trimmedName.Length > 100)
        {
            throw new ArgumentException("Full name must not exceed 100 characters.");
        }

        // Name should contain at least two parts (first and last name)
        var nameParts = trimmedName.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
        if (nameParts.Length < 2)
        {
            throw new ArgumentException("Please provide both first name and last name.");
        }

        // Email validation
        if (string.IsNullOrWhiteSpace(emailAddress))
        {
            throw new ArgumentException("Email address is required.");
        }

        var trimmedEmail = emailAddress.Trim();
        if (trimmedEmail.Length > 256)
        {
            throw new ArgumentException("Email address must not exceed 256 characters.");
        }

        // RFC 5322 compliant email validation pattern
        var emailPattern = @"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$";
        if (!Regex.IsMatch(trimmedEmail, emailPattern))
        {
            throw new ArgumentException("Invalid email format. Please enter a valid email address.");
        }

        // Phone number validation - numbers only, exactly 10 digits
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            throw new ArgumentException("Phone number is required.");
        }

        var trimmedPhone = phoneNumber.Trim();

        // Check if phone contains only digits
        if (!Regex.IsMatch(trimmedPhone, @"^\d+$"))
        {
            throw new ArgumentException("Phone number must contain only numbers.");
        }

        // Check if phone is exactly 10 digits
        if (trimmedPhone.Length != 10)
        {
            throw new ArgumentException("Phone number must be exactly 10 digits.");
        }

        // Password validation
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Password is required.");
        }

        var trimmedPassword = password.Trim();
        if (trimmedPassword.Length < 8)
        {
            throw new ArgumentException("Password must be at least 8 characters.");
        }

        if (trimmedPassword.Length > 128)
        {
            throw new ArgumentException("Password must not exceed 128 characters.");
        }

        if (!Regex.IsMatch(trimmedPassword, @"[A-Z]"))
        {
            throw new ArgumentException("Password must contain at least one uppercase letter.");
        }

        if (!Regex.IsMatch(trimmedPassword, @"[a-z]"))
        {
            throw new ArgumentException("Password must contain at least one lowercase letter.");
        }

        if (!Regex.IsMatch(trimmedPassword, @"\d"))
        {
            throw new ArgumentException("Password must contain at least one numeric digit.");
        }

        if (!Regex.IsMatch(trimmedPassword, @"[!@#$%^&*()_+\-=\[\]{};':""`~,.<>?/\\|]"))
        {
            throw new ArgumentException("Password must contain at least one special character (!@#$%^&*()_+-=[]{}';:\"` etc.).");
        }

        // Confirm password match
        if (string.IsNullOrWhiteSpace(confirmPassword))
        {
            throw new ArgumentException("Confirm password is required.");
        }

        if (!string.Equals(trimmedPassword, confirmPassword?.Trim(), StringComparison.Ordinal))
        {
            throw new ArgumentException("Passwords do not match.");
        }
    }

    private static void ValidateUpdateInput(string name, string email)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Please fill in all required fields.");
        }

        if (name.Trim().Length < 2)
        {
            throw new ArgumentException("Name must be at least 2 characters.");
        }

        if (!email.Contains('@') || !email.Contains('.'))
        {
            throw new ArgumentException("Invalid email format.");
        }
    }

    private static UserResponse MapToResponse(User user)
    {
        return new UserResponse
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Vehicles = user.Vehicles?.Where(v => v.DeletedAt == null).Select(v => new VehicleResponse
            {
                Id = v.Id,
                PlateNumber = v.PlateNumber,
                Model = v.Model,
                Make = v.Make,
                Year = v.Year,
                FuelType = v.FuelType,
                Mileage = v.Mileage
            }).ToList() ?? new List<VehicleResponse>()
        };
    }

    private string GenerateJwtToken(User user)
    {
        var roleName = user.Role.ToString();
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Role, roleName),
            new("role", roleName)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task EnsureUserRoleAssignmentAsync(User user, UserRole role)
    {
        var targetRole = role.ToString();
        var existingRoles = await _userManager.GetRolesAsync(user);

        if (existingRoles.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(user, existingRoles);
            if (!removeResult.Succeeded)
            {
                var errors = string.Join(" ", removeResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Role update failed: {errors}");
            }
        }

        var addResult = await _userManager.AddToRoleAsync(user, targetRole);
        if (!addResult.Succeeded)
        {
            var errors = string.Join(" ", addResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Role update failed: {errors}");
        }
    }
}
