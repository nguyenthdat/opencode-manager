# err-aggregateexception-flatten

> Flatten and inspect `AggregateException` when blocking on or observing multiple faulted tasks

## Why It Matters

`Task.WhenAll` awaited normally only rethrows the *first* exception, but calling `.Result`/`.Wait()` on a task (or a `Task.WhenAll` task) wraps all faults in an `AggregateException`, which can itself be nested when tasks are composed. `Flatten()` collapses nested aggregates into a single flat list so you can inspect every underlying failure.

## Bad

```csharp
var task = Task.WhenAll(DoAsync(1), DoAsync(2), DoAsync(3));
try
{
    task.Wait(); // blocks (see async-no-sync-over-async) and throws AggregateException
}
catch (Exception ex)
{
    // Only sees "One or more errors occurred" - the real per-task exceptions are hidden
    _logger.LogError(ex, "batch failed");
}
```

## Good

```csharp
public async Task RunBatchAsync()
{
    var tasks = new[] { DoAsync(1), DoAsync(2), DoAsync(3) };

    try
    {
        await Task.WhenAll(tasks); // rethrows only the FIRST exception when awaited
    }
    catch
    {
        // Inspect every task's outcome, not just the first exception
        var failures = tasks
            .Where(t => t.IsFaulted)
            .SelectMany(t => t.Exception!.Flatten().InnerExceptions);

        foreach (var failure in failures)
        {
            _logger.LogError(failure, "batch item failed");
        }
    }
}
```

## Flattening Nested Aggregates

```csharp
void HandleAggregate(AggregateException ex)
{
    // Flatten() collapses AggregateException-of-AggregateExceptions into one level
    foreach (var inner in ex.Flatten().InnerExceptions)
    {
        Console.WriteLine($"{inner.GetType().Name}: {inner.Message}");
    }
}

// Handle only specific exception types, rethrow an aggregate of the rest
try
{
    Parallel.Invoke(Step1, Step2, Step3);
}
catch (AggregateException ex)
{
    ex.Handle(inner =>
    {
        if (inner is TimeoutException)
        {
            _logger.LogWarning(inner, "step timed out, continuing");
            return true; // handled - removed from the rethrown set
        }
        return false; // not handled - included in a rethrown AggregateException
    });
}
```

## See Also

- [async-whenall-parallel](async-whenall-parallel.md) - Awaiting many tasks correctly
- [async-no-sync-over-async](async-no-sync-over-async.md) - Why `.Wait()`/`.Result` are risky
- [err-async-exception-propagation](err-async-exception-propagation.md) - How async exceptions flow
