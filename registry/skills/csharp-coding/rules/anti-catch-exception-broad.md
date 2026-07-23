# anti-catch-exception-broad

> Don't catch the base `Exception` type broadly and treat everything the same

## Why It Matters

A broad `catch (Exception)` swallows genuine bugs (`NullReferenceException`), cancellation signals (`OperationCanceledException`), and truly fatal conditions right alongside expected, recoverable failures - all treated identically, which hides real problems and breaks cooperative cancellation.

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
        return string.Empty; // hides HttpRequestException, TaskCanceledException, and real bugs alike
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
    // OperationCanceledException propagates untouched - cancellation stays cancellation
}
```

## The Narrow Exception: A Documented, Logged Top-Level Boundary

```csharp
// A host/worker loop that must never crash the process is the one place a
// broad catch is legitimate - and it must always log, never silently continue.
catch (Exception ex)
{
    _logger.LogError(ex, "Unhandled error processing message; continuing.");
}
```

## See Also

- [err-no-catch-exception](err-no-catch-exception.md) - The full rule with more detail
- [err-exception-filters-when](err-exception-filters-when.md) - Narrowing catches with `when`
