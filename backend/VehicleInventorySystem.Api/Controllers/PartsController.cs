using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleInventorySystem.Api.DTOs.Request;
using VehicleInventorySystem.Api.Services.Interfaces;
using VehicleInventorySystem.Api.DTOs.Response;

namespace VehicleInventorySystem.Api.Controllers;

[ApiController]
[Route("api/parts")]
[Authorize]
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

    [Authorize(Roles = "Admin,Staff,Customer")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? pageNumber, [FromQuery] int? pageSize)
    {
        if (pageNumber.HasValue || pageSize.HasValue)
        {
            var pagination = new PaginationRequest
            {
                PageNumber = pageNumber ?? 1,
                PageSize = pageSize ?? 10
            };
            return await ExecuteAsync(() => _partService.GetPaginatedPartsAsync(pagination));
        }
        return await ExecuteAsync(() => _partService.GetAllPartsAsync());
    }

    [Authorize(Roles = "Admin,Staff,Customer")]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        return await ExecuteAsync(() => _partService.GetPartByIdAsync(id));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePartRequest request)
    {
        return await ExecuteAsync(async () =>
        {
            var created = await _partService.CreatePartAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePartRequest request)
    {
        return await ExecuteAsync(() => _partService.UpdatePartAsync(id, request));
    }

    [Authorize(Roles = "Admin")]
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

        var result = await action();
        return Ok(result);
    }

    private async Task<IActionResult> ExecuteAsync(Func<Task<IActionResult>> action)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { message = "Invalid input.", errors = ModelState });
        }

        return await action();
    }
}
