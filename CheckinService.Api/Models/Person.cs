namespace CheckinService.Api.Models;

public class Person
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool CheckedIn { get; set; } = false;
    public DateTime? CheckInTime { get; set; }
    public Guid EventId { get; set; }
}