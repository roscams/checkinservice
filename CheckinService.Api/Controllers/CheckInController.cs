using CheckinService.Api.Models;
using CheckinService.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CheckinService.Api.Controllers;

[Authorize(Policy = "CheckInStaff")]
[ApiController]
[Route("api/[controller]")]
public class CheckInController : ControllerBase
{
    private readonly CheckinRepository _repository;
    private readonly ILogger<CheckInController> _logger;

    public CheckInController(CheckinRepository repository, ILogger<CheckInController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    [HttpPost("{eventId}/person/{personId}")]
    public async Task<IActionResult> CheckInPerson(Guid eventId, Guid personId)
    {
        var @event = await _repository.GetEventByIdAsync(eventId);
        if (@event == null)
        {
            return NotFound("Event not found");
        }

        var result = await _repository.CheckInPersonAsync(eventId, personId);
        if (!result)
        {
            return NotFound("Person not found in this event");
        }

        _logger.LogInformation("Person {PersonId} checked in to event {EventId}", personId, eventId);
        return Ok(new { Message = "Check-in successful" });
    }

    [HttpGet("status/{eventId}")]
    public async Task<ActionResult<CheckInStatus>> GetCheckInStatus(Guid eventId)
    {
        var @event = await _repository.GetEventByIdAsync(eventId);
        if (@event == null)
        {
            return NotFound("Event not found");
        }

        var checkedIn = (await _repository.GetCheckedInPeopleAsync(eventId)).ToList();
        var notCheckedIn = (await _repository.GetNotCheckedInPeopleAsync(eventId)).ToList();

        var status = new CheckInStatus
        {
            EventId = eventId,
            EventName = @event.Name,
            TotalPeople = @event.People.Count,
            CheckedInCount = checkedIn.Count,
            NotCheckedInCount = notCheckedIn.Count,
            CheckedInPeople = checkedIn,
            NotCheckedInPeople = notCheckedIn
        };

        return Ok(status);
    }
    
    [HttpPut("{eventId}/person/{personId}/toggle")]
    public async Task<IActionResult> ToggleCheckInStatus(Guid eventId, Guid personId)
    {
        var @event = await _repository.GetEventByIdAsync(eventId);
        if (@event == null)
        {
            return NotFound("Event not found");
        }

        var result = await _repository.ToggleCheckInStatusAsync(eventId, personId);
        if (!result)
        {
            return NotFound("Person not found in this event");
        }

        // Get the updated person to determine their new status
        var person = @event.People.FirstOrDefault(p => p.Id == personId);
        string status = person?.CheckedIn == true ? "checked in" : "checked out";
        
        _logger.LogInformation("Person {PersonId} {Status} of event {EventId}", personId, status, eventId);
        return Ok(new { Message = $"Person {status} successfully" });
    }
}

public class CheckInStatus
{
    public Guid EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public int TotalPeople { get; set; }
    public int CheckedInCount { get; set; }
    public int NotCheckedInCount { get; set; }
    public List<Person> CheckedInPeople { get; set; } = new();
    public List<Person> NotCheckedInPeople { get; set; } = new();
}