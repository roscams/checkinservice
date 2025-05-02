using CheckinService.Api.Data;
using CheckinService.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CheckinService.Api.Services;

public class CheckinRepository
{
    private readonly CheckinDbContext _context;

    public CheckinRepository(CheckinDbContext context)
    {
        _context = context;
    }

    // Event operations
    public async Task<IEnumerable<Event>> GetAllEventsAsync()
    {
        return await _context.Events
            .Include(e => e.People)
            .ToListAsync();
    }

    public async Task<Event?> GetEventByIdAsync(Guid id)
    {
        return await _context.Events
            .Include(e => e.People)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<Event> AddEventAsync(Event @event)
    {
        _context.Events.Add(@event);
        await _context.SaveChangesAsync();
        return @event;
    }

    public async Task<bool> RemoveEventAsync(Guid id)
    {
        var @event = await _context.Events.FindAsync(id);
        if (@event == null) return false;

        _context.Events.Remove(@event);
        await _context.SaveChangesAsync();
        return true;
    }

    // Person operations
    
    // Clear all people from an event
    public async Task<bool> ClearPeopleFromEventAsync(Guid eventId)
    {
        var @event = await _context.Events.FindAsync(eventId);
        if (@event == null) throw new ArgumentException("Event not found", nameof(eventId));

        var peopleToRemove = await _context.People
            .Where(p => p.EventId == eventId)
            .ToListAsync();
            
        if (peopleToRemove.Any())
        {
            _context.People.RemoveRange(peopleToRemove);
            await _context.SaveChangesAsync();
        }
        
        return true;
    }
    
    public async Task<IEnumerable<Person>> AddPeopleToEventAsync(Guid eventId, IEnumerable<Person> people)
    {
        var @event = await _context.Events.FindAsync(eventId);
        if (@event == null) throw new ArgumentException("Event not found", nameof(eventId));

        foreach (var person in people)
        {
            person.EventId = eventId;
            _context.People.Add(person);
        }

        await _context.SaveChangesAsync();
        return people;
    }

    public async Task<bool> CheckInPersonAsync(Guid eventId, Guid personId)
    {
        var person = await _context.People
            .FirstOrDefaultAsync(p => p.Id == personId && p.EventId == eventId);

        if (person == null) return false;

        person.CheckedIn = true;
        person.CheckInTime = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<Person>> GetCheckedInPeopleAsync(Guid eventId)
    {
        return await _context.People
            .Where(p => p.EventId == eventId && p.CheckedIn)
            .ToListAsync();
    }

    public async Task<IEnumerable<Person>> GetNotCheckedInPeopleAsync(Guid eventId)
    {
        return await _context.People
            .Where(p => p.EventId == eventId && !p.CheckedIn)
            .ToListAsync();
    }
    
    // Remove a person from an event
    public async Task<bool> RemovePersonAsync(Guid eventId, Guid personId)
    {
        var person = await _context.People
            .FirstOrDefaultAsync(p => p.Id == personId && p.EventId == eventId);
            
        if (person == null) return false;
        
        _context.People.Remove(person);
        await _context.SaveChangesAsync();
        return true;
    }
    
    // Toggle check-in status of a person
    public async Task<bool> ToggleCheckInStatusAsync(Guid eventId, Guid personId)
    {
        var person = await _context.People
            .FirstOrDefaultAsync(p => p.Id == personId && p.EventId == eventId);
            
        if (person == null) return false;
        
        // Toggle the check-in status
        person.CheckedIn = !person.CheckedIn;
        
        // Update check-in time if checking in, set to null if unchecking
        person.CheckInTime = person.CheckedIn ? DateTime.UtcNow : null;
        
        await _context.SaveChangesAsync();
        return true;
    }
}