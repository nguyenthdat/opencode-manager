# err-exception-filters-when

> Use exception filters (`catch (Ex ex) when (condition)`) instead of catch-log-rethrow logic

## Why It Matters

An exception filter evaluates its condition *before* unwinding the stack, and lets the exception pass through untouched if the filter is false. This means the original stack trace stays fully intact for diagnostics, and lets you branch on exception details (status codes, messages) without needing nested `if`/`throw` inside a catch block.

## Bad

```csharp
try
{
    await CallServiceAsync();
}
catch (HttpRequestException ex)
{
    if (ex.StatusCode == HttpStatusCode.TooManyRequests)
    {
        await Task.Delay(RetryDelay);
        await CallServiceAsync();
    }
    else
    {
        throw; // works, but the branching logic is buried inside the catch body
    }
}
```

## Good

```csharp
try
{
    await CallServiceAsync();
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.TooManyRequests)
{
    await Task.Delay(RetryDelay);
    await CallServiceAsync();
}
// Any other HttpRequestException (or other exception type) propagates untouched,
// with its original stack trace and type, to the next handler.
```

## Filters for Logging Without Handling

```csharp
// Log as a side effect of the filter, then let the exception continue propagating -
// this is a common, deliberate pattern for "observe but don't handle"
try
{
    Process();
}
catch (Exception ex) when (LogAndReturnFalse(ex))
{
    // never reached - LogAndReturnFalse always returns false
}

bool LogAndReturnFalse(Exception ex)
{
    _logger.LogError(ex, "Unhandled exception during Process");
    return false;
}
```

## Multiple Filtered Catches

```csharp
try
{
    await SubmitAsync(payment);
}
catch (PaymentException ex) when (ex.IsTransient)
{
    await RetryAsync(payment);
}
catch (PaymentException ex) when (!ex.IsTransient)
{
    await NotifyCustomerAsync(ex.Message);
}
```

## See Also

- [err-preserve-stack-trace](err-preserve-stack-trace.md) - Why `throw;` matters here too
- [err-no-catch-exception](err-no-catch-exception.md) - Avoiding overly broad catches
- [err-custom-hierarchy](err-custom-hierarchy.md) - Exception types that carry filterable data
