using CheckinService.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CheckinService.Api.Data;

public class CheckinDbContext : DbContext
{
    public CheckinDbContext(DbContextOptions<CheckinDbContext> options) : base(options)
    {
    }

    public DbSet<Event> Events { get; set; } = null!;
    public DbSet<Person> People { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Event entity
        modelBuilder.Entity<Event>()
            .HasKey(e => e.Id);

        modelBuilder.Entity<Event>()
            .Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(100);

        modelBuilder.Entity<Event>()
            .Property(e => e.Description)
            .HasMaxLength(500);

        // Configure Person entity
        modelBuilder.Entity<Person>()
            .HasKey(p => p.Id);

        modelBuilder.Entity<Person>()
            .Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(100);

        modelBuilder.Entity<Person>()
            .Property(p => p.Email)
            .HasMaxLength(100);

        // Configure relationship
        modelBuilder.Entity<Person>()
            .HasOne<Event>()
            .WithMany(e => e.People)
            .HasForeignKey("EventId")
            .OnDelete(DeleteBehavior.Cascade);
    }
}