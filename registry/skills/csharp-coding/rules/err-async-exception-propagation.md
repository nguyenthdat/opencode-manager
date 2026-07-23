# err-async-exception-propagation

> Understand how exceptions surface from `Task`-returning and `async` methods before you rely on try/catch around them

## Why It Matters

An exception thrown inside an `async` method is captured into the returned `Task`, not thrown synchronously at the call site. If you never `await` (or otherwise observe) that task, the exception can be silently lost - or, prior to .NET 4.5 semantics changes, crash the process as an unobserved task exception. Understanding this is essential to write correct error handling around async code.

## Bad

```csharp
public async Task RunAsync()
{
    var task = DoWorkAsync(); // exception, if any, is now stored inside `task`
    // ... other code ...
    // task is never awaited - if DoWorkAsync faults, nobody observes it
}

async Task DoWorkAsync()
{
    throw new InvalidOperationException("boom");
}
```

## Good

```csharp
public async Task RunAsync()
{
    try
    {
        await DoWorkAsync(); // awaiting re-throws the captured exception here
    }
    catch (InvalidOperationException ex)
    {
        _logger.LogError(ex, "DoWorkAsync failed");
    }
}
```

## Fire-and-Forget Needs Explicit Handling

```csharp
// If you intentionally don't await (fire-and-forget), you MUST handle
// exceptions inside the async method itself - nothing else will observe them.
public void StartBackgroundWork()
{
    _ = RunSafelyAsync();
}

private async Task RunSafelyAsync()
{
    try
    {
        await DoWorkAsync();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Background work failed");
    }
}
```

## async void Cannot Be Caught by the Caller

```csharp
// async void methods report exceptions via SynchronizationContext.Current or
// crash the process - a caller's try/catch around the call CANNOT catch them.
async void BadHandler() => await DoWorkAsync(); // exception escapes uncatchably

try
{
    BadHandler(); // does NOT catch exceptions thrown inside BadHandler
}
catch (Exception)
{
    // never reached for async void failures
}
```

## See Also

- [async-no-async-void](async-no-async-void.md) - Why async void breaks exception handling
- [err-aggregateexception-flatten](err-aggregateexception-flatten.md) - Exceptions from multiple parallel tasks
- [async-whenall-parallel](async-whenall-parallel.md) - Awaiting multiple tasks correctly
