# async-iasyncenumerable-streaming

> Use `IAsyncEnumerable<T>` to stream sequences produced asynchronously, instead of buffering into a `List<T>` first

## Why It Matters

Returning `Task<List<T>>` forces the entire sequence into memory and forces the caller to wait for every item before processing any of them. `IAsyncEnumerable<T>` (with `await foreach`) streams items as they become available, reducing memory footprint and latency to first result - especially valuable for paginated APIs, large query results, or server-sent data.

## Bad

```csharp
public async Task<List<LogEntry>> GetLogsAsync(DateTime since)
{
    var results = new List<LogEntry>();
    await foreach (var page in _client.GetPagesAsync(since))
    {
        results.AddRange(page.Items); // buffers everything before the caller sees anything
    }
    return results;
}

var logs = await GetLogsAsync(since); // must wait for ALL pages before processing starts
foreach (var log in logs) Process(log);
```

## Good

```csharp
public async IAsyncEnumerable<LogEntry> GetLogsAsync(
    DateTime since,
    [EnumeratorCancellation] CancellationToken cancellationToken = default)
{
    await foreach (var page in _client.GetPagesAsync(since, cancellationToken))
    {
        foreach (var item in page.Items)
        {
            yield return item; // caller can process each item as soon as it arrives
        }
    }
}

await foreach (var log in GetLogsAsync(since, ct))
{
    Process(log); // processing starts as soon as the first item is available
}
```

## Cancellation With Async Iterators

```csharp
// [EnumeratorCancellation] lets `await foreach (... WithCancellation(token))` flow
// the token into the generator method automatically.
await foreach (var log in GetLogsAsync(since).WithCancellation(cancellationToken))
{
    Process(log);
}
```

## Consuming With LINQ (`System.Linq.Async`)

```csharp
// The System.Linq.Async package adds LINQ-style operators over IAsyncEnumerable<T>
using System.Linq;

var errorCount = await GetLogsAsync(since)
    .Where(l => l.Level == LogLevel.Error)
    .CountAsync();
```

## See Also

- [async-cancellationtoken-propagate](async-cancellationtoken-propagate.md) - Threading cancellation through async code
- [async-channels-producer-consumer](async-channels-producer-consumer.md) - An alternative for producer/consumer streaming
- [linq-iqueryable-vs-ienumerable](linq-iqueryable-vs-ienumerable.md) - Related deferred-execution concepts
