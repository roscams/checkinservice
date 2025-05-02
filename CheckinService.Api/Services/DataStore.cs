using CheckinService.Api.Models;

namespace CheckinService.Api.Services;

public class DataStore
{
    private readonly List<Event> _events = new();

    public IEnumerable<Event> GetAllEvents() => _events;

    public Event? GetEventById(Guid id) => _events.FirstOrDefault(e => e.Id == id);

    public void AddEvent(Event @event) => _events.Add(@event);

    public bool RemoveEvent(Guid id)
    {
        var @event = GetEventById(id);
        if (@event == null) return false;
        return _events.Remove(@event);
    }

    public bool AddPersonToEvent(Guid eventId, Person person)
    {
        var @event = GetEventById(eventId);
        if (@event == null) return false;
        @event.People.Add(person);
        return true;
    }

    public bool CheckInPerson(Guid eventId, Guid personId)
    {
        var @event = GetEventById(eventId);
        if (@event == null) return false;

        var person = @event.People.FirstOrDefault(p => p.Id == personId);
        if (person == null) return false;

        person.CheckedIn = true;
        person.CheckInTime = DateTime.UtcNow;
        return true;
    }

    public IEnumerable<Person> GetCheckedInPeople(Guid eventId)
    {
        var @event = GetEventById(eventId);
        return @event?.People.Where(p => p.CheckedIn) ?? Enumerable.Empty<Person>();
    }

    public IEnumerable<Person> GetNotCheckedInPeople(Guid eventId)
    {
        var @event = GetEventById(eventId);
        return @event?.People.Where(p => !p.CheckedIn) ?? Enumerable.Empty<Person>();
    }
}