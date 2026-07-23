# linq-deferred-execution-aware

> Understand LINQ's deferred execution; materialize with `ToList()`/`ToArray()` deliberately, not by accident

## Why It Matters

Most LINQ operators (`Where`, `Select`, `OrderBy`, etc.) build a lazy query that only actually runs when enumerated (by `foreach`, `ToList()`, `First()`, etc.). This means the query can re-run every time it's enumerated, can observe changes to the underlying data between enumerations, and can throw exceptions later than expected (at enumeration time, not at query-construction time).

## Bad

```csharp
var expensiveQuery = orders.Where(o => IsExpensiveCheck(o)); // nothing has run yet

if (expensiveQuery.Any())       // runs the whole filter once...
{
    foreach (var order in expensiveQuery) // ...and runs it AGAIN from scratch here
    {
        Process(order);
    }
}

// Query captures a variable by reference - result can change unexpectedly
var threshold = 100;
var query = orders.Where(o => o.Total > threshold);
threshold = 200; // this now affects `query` too, since it hasn't been enumerated yet
foreach (var order in query) { /* uses threshold == 200, not 100 */ }
```

## Good

```csharp
var expensiveResults = orders.Where(o => IsExpensiveCheck(o)).ToList(); // runs exactly once, now

if (expensiveResults.Count > 0)
{
    foreach (var order in expensiveResults) // just iterates the materialized list
    {
        Process(order);
    }
}
```

## When Laziness Is Actually Desirable

```csharp
// Streaming a large file without loading it all into memory - deferred execution
// is exactly the right behavior here.
public IEnumerable<LogEntry> ReadErrors(string path) =>
    File.ReadLines(path)
        .Select(ParseLine)
        .Where(entry => entry.Level == LogLevel.Error);
// Caller can foreach over this without ever holding the whole file in memory.
```

## See Also

- [linq-avoid-multiple-enumeration](linq-avoid-multiple-enumeration.md) - The specific "runs twice" pitfall
- [linq-iqueryable-vs-ienumerable](linq-iqueryable-vs-ienumerable.md) - Deferred execution against a database
- [anti-linq-multiple-enumeration](anti-linq-multiple-enumeration.md) - Anti-pattern reference
