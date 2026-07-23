# async-cancellationtoken-propagate

> Accept and propagate `CancellationToken` through the entire async call chain

## Why It Matters

Cancellation only works end-to-end if every async method in the chain accepts a `CancellationToken` and passes it down to the operations it awaits. A single method that drops the token (or doesn't accept one) breaks cancellation for everything beneath it, leaving requests to run to completion even after a client disconnects or a timeout fires.

## Bad

```csharp
public async Task<Report> GenerateReportAsync(int userId)
{
    var user = await _users.GetAsync(userId);           // no token - can't be cancelled
    var orders = await _orders.GetForUserAsync(userId); // same problem
    return BuildReport(user, orders);
}
```

## Good

```csharp
public async Task<Report> GenerateReportAsync(int userId, CancellationToken cancellationToken)
{
    var user = await _users.GetAsync(userId, cancellationToken);
    var orders = await _orders.GetForUserAsync(userId, cancellationToken);
    cancellationToken.ThrowIfCancellationRequested(); // check before expensive CPU-bound work
    return BuildReport(user, orders);
}
```

## ASP.NET Core Wires It Up Automatically

```csharp
// A CancellationToken parameter on a minimal API or controller action is bound
// automatically to the request's RequestAborted token - just accept it and pass it on.
app.MapGet("/reports/{userId:int}", async (int userId, ReportService svc, CancellationToken ct) =>
    await svc.GenerateReportAsync(userId, ct));
```

## Combining Tokens

```csharp
// Combine a caller's token with an internal timeout
public async Task<Data> FetchWithTimeoutAsync(CancellationToken callerToken)
{
    using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
    using var linked = CancellationTokenSource.CreateLinkedTokenSource(callerToken, timeoutCts.Token);

    return await _client.GetDataAsync(linked.Token);
}
```

## Default Parameter for Optional Cancellation

```csharp
// A default of CancellationToken.None keeps the API ergonomic for simple call sites
// while still supporting cancellation for callers that need it.
public Task<Data> FetchAsync(string id, CancellationToken cancellationToken = default) =>
    _client.GetDataAsync(id, cancellationToken);
```

## See Also

- [async-whenany-timeout](async-whenany-timeout.md) - Racing against a timeout
- [async-iasyncenumerable-streaming](async-iasyncenumerable-streaming.md) - Cancellation for async streams
- [test-avoid-thread-sleep](test-avoid-thread-sleep.md) - Testing cancellation without real delays
