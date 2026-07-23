# err-no-catch-exception

> Don't catch the base `Exception` type broadly; catch the specific exceptions you can actually handle

## Why It Matters

Catching `Exception` (or `SystemException`) swallows everything - `OutOfMemoryException`, `StackOverflowException`-adjacent conditions, `NullReferenceException` from a real bug, cancellation exceptions - and treats them all the same as an expected failure. This hides bugs, breaks cancellation, and makes debugging production incidents much harder.

## Bad

```csharp
public async Task<string> FetchAsync(string url)
{
    try
    {
        return await _client.GetStringAsync(url);
    }
    catch (Exception)
    {
        return string.Empty; // swallows HttpRequestException, TaskCanceledException,
                              // and any programming bug, indistinguishably
    }
}
```

## Good

```csharp
public async Task<string?> FetchAsync(string url, CancellationToken cancellationToken)
{
    try
    {
        return await _client.GetStringAsync(url, cancellationToken);
    }
    catch (HttpRequestException ex)
    {
        _logger.LogWarning(ex, "Failed to fetch {Url}", url);
        return null;
    }
    // OperationCanceledException is intentionally NOT caught here - let it propagate
    // so callers observing cancellation see it as cancellation, not a normal failure.
}
```

## When a Broad Catch Is Legitimate

```csharp
// Top-level boundary: a host/worker loop that must never crash the process,
// where you log and continue - this is the ONE place a broad catch belongs.
public async Task RunAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        try
        {
            await ProcessNextMessageAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            break; // expected shutdown path
        }
        catch (Exception ex) // last-resort boundary catch, always logged
        {
            _logger.LogError(ex, "Unhandled error processing message; continuing.");
        }
    }
}
```

## See Also

- [err-custom-hierarchy](err-custom-hierarchy.md) - Catching specific domain exceptions
- [err-exception-filters-when](err-exception-filters-when.md) - Narrowing catches with `when`
- [anti-catch-exception-broad](anti-catch-exception-broad.md) - Anti-pattern reference
