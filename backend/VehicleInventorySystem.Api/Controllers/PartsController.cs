using Microsoft.AspNetCore.Mvc;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/parts")]
public class PartsController : ControllerBase
{
    private readonly IPartService _partService;
    private readonly ILogger<PartsController> _logger;
    private readonly IWebHostEnvironment _environment;

    public PartsController(IPartService partService, ILogger<PartsController> logger, IWebHostEnvironment environment)
    {
        _partService = partService;
        _logger = logger;
        _environment = environment;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return await ExecuteAsync(() => _partService.GetAllPartsAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        return await ExecuteAsync(() => _partService.GetPartByIdAsync(id));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePartRequest request)
    {
        return await ExecuteAsync(async () =>
        {
            var created = await _partService.CreatePartAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePartRequest request)
    {
        return await ExecuteAsync(() => _partService.UpdatePartAsync(id, request));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        return await ExecuteAsync(() => _partService.TogglePartStatusAsync(id));
    }

    private async Task<IActionResult> ExecuteAsync<T>(Func<Task<T>> action)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { message = "Invalid input.", errors = ModelState });
        }

        try
        {
            var result = await action();
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in PartsController (ExecuteAsync<T>).");
            var errorMessage = _environment.IsDevelopment()
                ? (ex.InnerException?.Message ?? ex.Message)
                : "Something went wrong. Please try again.";

            return StatusCode(500, new { message = errorMessage });
        }
    }

    private async Task<IActionResult> ExecuteAsync(Func<Task<IActionResult>> action)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { message = "Invalid input.", errors = ModelState });
        }

        try
        {
            return await action();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in PartsController (ExecuteAsync).");
            var errorMessage = _environment.IsDevelopment()
                ? (ex.InnerException?.Message ?? ex.Message)
                : "Something went wrong. Please try again.";

            return StatusCode(500, new { message = errorMessage });
        }
    }
}