# anti-sync-over-async

> Don't block on async code with `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()`

## Why It Matters

Blocking synchronously on a `Task` risks deadlocking whenever a `SynchronizationContext` is present, because the awaited continuation may need the very thread that's now blocked waiting for it. Even without a deadlock, it wastes a thread pool thread sitting idle instead of returning it to the pool, hurting throughput under load.

## Bad

```csharp
public string GetData()
{
    return FetchDataAsync().Result; // can deadlock, always wastes a thread while blocked
}

public void SaveAll(IEnumerable<Order> orders)
{
    foreach (var order in orders)
    {
        SaveAsync(order).Wait(); // blocks per-iteration, serializing what could be concurrent I/O
    }
}
```

## Good

```csharp
public async Task<string> GetDataAsync() => await FetchDataAsync();

public async Task SaveAllAsync(IEnumerable<Order> orders)
{
    await Task.WhenAll(orders.Select(SaveAsync)); // concurrent, non-blocking
}
```

## Making the Call Chain Async All the Way Up

```csharp
// The fix is almost always to make the CALLER async too, propagating async/await
// up to the entry point (Main, a controller action, a background service loop)
// rather than blocking partway through the chain.
public static async Task Main(string[] args)
{
    await RunAsync();
}
```

## See Also

- [async-no-sync-over-async](async-no-sync-over-async.md) - The full rule with more detail
- [async-configureawait-false-lib](async-configureawait-false-lib.md) - Reduces (doesn't eliminate) deadlock risk
