# async-whenall-parallel

> Use `Task.WhenAll` to run independent async operations concurrently instead of awaiting them one by one

## Why It Matters

Awaiting a series of independent async calls sequentially adds up their latencies. `Task.WhenAll` starts all the operations first, then awaits their combined completion, so the total time is roughly the slowest single operation instead of the sum of all of them.

## Bad

```csharp
public async Task<Dashboard> BuildDashboardAsync(int userId)
{
    var profile = await _profiles.GetAsync(userId);     // e.g. 100ms
    var orders = await _orders.GetForUserAsync(userId);  // e.g. 150ms
    var alerts = await _alerts.GetForUserAsync(userId);  // e.g. 80ms
    // Total: ~330ms, even though none of these depend on each other
    return new Dashboard(profile, orders, alerts);
}
```

## Good

```csharp
public async Task<Dashboard> BuildDashboardAsync(int userId)
{
    var profileTask = _profiles.GetAsync(userId);       // started immediately
    var ordersTask = _orders.GetForUserAsync(userId);   // started immediately
    var alertsTask = _alerts.GetForUserAsync(userId);   // started immediately

    await Task.WhenAll(profileTask, ordersTask, alertsTask);
    // Total: ~150ms (the slowest of the three)

    return new Dashboard(profileTask.Result, ordersTask.Result, alertsTask.Result);
    // .Result is safe here ONLY because WhenAll already guarantees completion
}
```

## Typed Results With Task.WhenAll

```csharp
// Await individually after WhenAll for cleaner typed access than .Result
public async Task<Dashboard> BuildDashboardAsync(int userId)
{
    var profileTask = _profiles.GetAsync(userId);
    var ordersTask = _orders.GetForUserAsync(userId);
    var alertsTask = _alerts.GetForUserAsync(userId);

    await Task.WhenAll(profileTask, ordersTask, alertsTask);

    return new Dashboard(await profileTask, await ordersTask, await alertsTask);
}
```

## Watch Exception Behavior

```csharp
// Task.WhenAll awaited normally rethrows only the FIRST exception encountered -
// see err-aggregateexception-flatten to inspect ALL failures when that matters.
```

## See Also

- [async-whenany-timeout](async-whenany-timeout.md) - Related composition primitive for racing tasks
- [err-aggregateexception-flatten](err-aggregateexception-flatten.md) - Seeing every failure, not just the first
- [async-semaphoreslim-lock](async-semaphoreslim-lock.md) - Bounding concurrency when running many tasks
