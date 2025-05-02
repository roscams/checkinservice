namespace CheckinService.Api.Models;

public class Event
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<Person> People { get; set; } = new List<Person>();
}