using CheckinService.Api.Models;
using CheckinService.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CheckinService.Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[ApiController]
[Route("api/[controller]")]
public class EventController : ControllerBase
{
    private readonly CheckinRepository _repository;
    private readonly CsvParserService _csvParserService;
    private readonly ILogger<EventController> _logger;

    public EventController(
        CheckinRepository repository,
        CsvParserService csvParserService,
        ILogger<EventController> logger)
    {
        _repository = repository;
        _csvParserService = csvParserService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Event>>> GetAllEvents()
    {
        var events = await _repository.GetAllEventsAsync();
        return Ok(events);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Event>> GetEvent(Guid id)
    {
        var @event = await _repository.GetEventByIdAsync(id);
        if (@event == null)
        {
            return NotFound();
        }

        return Ok(@event);
    }

    [HttpPost]
    public async Task<ActionResult<Event>> CreateEvent([FromBody] Event @event)
    {
        if (@event == null)
        {
            return BadRequest("Event data is required");
        }

        // Ensure a new ID is generated
        @event.Id = Guid.NewGuid();
        
        await _repository.AddEventAsync(@event);
        
        return CreatedAtAction(nameof(GetEvent), new { id = @event.Id }, @event);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        var result = await _repository.RemoveEventAsync(id);
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPost("{id}/upload-csv")]
    public async Task<IActionResult> UploadCsv(Guid id, IFormFile file)
    {
        var @event = await _repository.GetEventByIdAsync(id);
        if (@event == null)
        {
            return NotFound("Event not found");
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded");
        }

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Only CSV files are supported");
        }

        try
        {
            // Clear existing attendees for this event
            await _repository.ClearPeopleFromEventAsync(id);
            _logger.LogInformation("Cleared existing attendees from event {EventId}", id);
            
            using var stream = file.OpenReadStream();
            var people = _csvParserService.ParseCsv(stream).ToList();
            
            _logger.LogInformation("Parsed {Count} people from CSV", people.Count);
            
            await _repository.AddPeopleToEventAsync(id, people);

            return Ok(new { Message = $"Successfully replaced attendees with {people.Count} people from the CSV" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing CSV file");
            return StatusCode(500, "Error processing CSV file");
        }
    }

    [HttpGet("{id}/checked-in")]
    public async Task<ActionResult<IEnumerable<Person>>> GetCheckedInPeople(Guid id)
    {
        var @event = await _repository.GetEventByIdAsync(id);
        if (@event == null)
        {
            return NotFound("Event not found");
        }

        var checkedInPeople = await _repository.GetCheckedInPeopleAsync(id);
        return Ok(checkedInPeople);
    }

    [HttpGet("{id}/not-checked-in")]
    public async Task<ActionResult<IEnumerable<Person>>> GetNotCheckedInPeople(Guid id)
    {
        var @event = await _repository.GetEventByIdAsync(id);
        if (@event == null)
        {
            return NotFound("Event not found");
        }

        var notCheckedInPeople = await _repository.GetNotCheckedInPeopleAsync(id);
        return Ok(notCheckedInPeople);
    }
    
    [HttpDelete("{id}/person/{personId}")]
    public async Task<IActionResult> RemovePerson(Guid id, Guid personId)
    {
        var @event = await _repository.GetEventByIdAsync(id);
        if (@event == null)
        {
            return NotFound("Event not found");
        }
        
        var result = await _repository.RemovePersonAsync(id, personId);
        if (!result)
        {
            return NotFound("Person not found in this event");
        }
        
        _logger.LogInformation("Person {PersonId} removed from event {EventId}", personId, id);
        return Ok(new { Message = "Person removed successfully" });
    }
}