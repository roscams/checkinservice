using System.Globalization;
using CheckinService.Api.Models;

namespace CheckinService.Api.Services;

public class CsvParserService
{
    public IEnumerable<Person> ParseCsv(Stream csvStream)
    {
        var people = new List<Person>();
        
        using var reader = new StreamReader(csvStream);
        
        // Skip header row if it exists
        var headerLine = reader.ReadLine();
        if (string.IsNullOrEmpty(headerLine))
        {
            return people;
        }
        
        // Check if the first line is a header or data
        var isHeader = headerLine.Contains("Name", StringComparison.OrdinalIgnoreCase) && 
                       headerLine.Contains("Email", StringComparison.OrdinalIgnoreCase);
        
        // If the first line is data, process it
        if (!isHeader)
        {
            var person = ProcessCsvLine(headerLine);
            if (person != null)
            {
                people.Add(person);
            }
        }
        
        // Process the rest of the lines
        while (!reader.EndOfStream)
        {
            var line = reader.ReadLine();
            if (string.IsNullOrEmpty(line)) continue;
            
            var person = ProcessCsvLine(line);
            if (person != null)
            {
                people.Add(person);
            }
        }
        
        return people;
    }
    
    private Person? ProcessCsvLine(string line)
    {
        var values = line.Split(',');
        
        // Expect at least name and email
        if (values.Length < 2) return null;
        
        return new Person
        {
            Name = values[0].Trim(),
            Email = values[1].Trim()
        };
    }
}