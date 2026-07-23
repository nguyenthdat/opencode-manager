# async-semaphoreslim-lock

> Use `SemaphoreSlim` for async-safe mutual exclusion; the `lock` statement cannot wrap an `await`

## Why It Matters

The C# `lock` statement (built on `Monitor`) is a synchronous, thread-affine primitive - the compiler forbids `await` inside a `lock` block because a task's continuation might resume on a different thread, breaking the monitor's ownership model. `SemaphoreSlim` (with `WaitAsync`/`Release`) provides equivalent mutual exclusion that works correctly across `await` boundaries.

## Bad

```csharp
private readonly object _gate = new();

public async Task UpdateAsync()
{
    lock (_gate) // CS1996: cannot await in the body of a lock statement
    {
        await SaveAsync();
    }
}
```

## Good

```csharp
private readonly SemaphoreSlim _gate = new(initialCount: 1, maxCount: 1);

public async Task UpdateAsync()
{
    await _gate.WaitAsync();
    try
    {
        await SaveAsync(); // safe to await while "holding" the semaphore
    }
    finally
    {
        _gate.Release(); // always release, even on exception
    }
}
```

## Limiting Concurrency (Not Just Mutual Exclusion)

```csharp
// SemaphoreSlim also works as a general concurrency limiter, not just a 1-count lock
private readonly SemaphoreSlim _throttle = new(initialCount: 4); // max 4 concurrent

public async Task ProcessAllAsync(IEnumerable<Item> items, CancellationToken ct)
{
    var tasks = items.Select(async item =>
    {
        await _throttle.WaitAsync(ct);
        try
        {
            await ProcessAsync(item, ct);
        }
        finally
        {
            _throttle.Release();
        }
    });

    await Task.WhenAll(tasks);
}
```

## With a Cancellation Token and Timeout

```csharp
if (!await _gate.WaitAsync(TimeSpan.FromSeconds(5), cancellationToken))
{
    throw new TimeoutException("Could not acquire the update lock in time.");
}
try
{
    await SaveAsync();
}
finally
{
    _gate.Release();
}
```

## See Also

- [async-lock-not-monitor-async](async-lock-not-monitor-async.md) - The related "never hold a sync lock across await" rule
- [async-whenall-parallel](async-whenall-parallel.md) - Bounding concurrency with Task.WhenAll
- [anti-sync-over-async](anti-sync-over-async.md) - Related blocking-call pitfalls
