# async-whenany-timeout

> Use `Task.WhenAny` to race a task against a timeout or cancellation without a `CancellationToken`-aware API

## Why It Matters

Not every async API accepts a `CancellationToken` or a timeout parameter. `Task.WhenAny` lets you race the real operation against a `Task.Delay`, letting you time out at the call site even when the underlying operation can't be told to stop.

## Bad

```csharp
public async Task<string> FetchWithNoTimeoutAsync(string url)
{
    // If the legacy client hangs, this awaits forever
    return await _legacyClient.GetStringNoTokenAsync(url);
}
```

## Good

```csharp
public async Task<string> FetchWithTimeoutAsync(string url, TimeSpan timeout)
{
    var fetchTask = _legacyClient.GetStringNoTokenAsync(url);
    var timeoutTask = Task.Delay(timeout);

    var completed = await Task.WhenAny(fetchTask, timeoutTask);
    if (completed == timeoutTask)
    {
        throw new TimeoutException($"Fetching '{url}' timed out after {timeout}.");
    }

    return await fetchTask; // rethrows if fetchTask itself faulted
}
```

## Prefer CancellationToken When Available

```csharp
// If the API supports cancellation, prefer it over WhenAny + Delay - it actually
// stops the underlying work instead of just abandoning it (which still runs to
// completion in the background, wasting resources).
public async Task<string> FetchWithCancellationAsync(string url, TimeSpan timeout)
{
    using var cts = new CancellationTokenSource(timeout);
    return await _modernClient.GetStringAsync(url, cts.Token);
}
```

## Racing Multiple Real Operations

```csharp
public async Task<Response> FetchFromFastestMirrorAsync(IReadOnlyList<string> mirrors)
{
    var tasks = mirrors.Select(m => _client.GetAsync(m)).ToList();
    var first = await Task.WhenAny(tasks);
    return await first; // the winner; the losers keep running and are simply ignored
}
```

## See Also

- [async-cancellationtoken-propagate](async-cancellationtoken-propagate.md) - The preferred alternative when supported
- [async-whenall-parallel](async-whenall-parallel.md) - Waiting for all instead of the first
