# mem-await-using-async

> Use `await using` for types implementing `IAsyncDisposable`

## Why It Matters

Some resources (e.g. `DbConnection`, `SqlDataReader`, channels, some streams) implement `IAsyncDisposable` because their cleanup involves I/O (flushing, closing a socket). Calling the synchronous `Dispose()` on them can block a thread on I/O; `await using` calls `DisposeAsync()` and awaits it, keeping the thread free.

## Bad

```csharp
public void WriteReport(Stream destination, Report report)
{
    // Stream may implement IAsyncDisposable; sync Dispose blocks on flush
    using var writer = new Utf8JsonAsyncWriter(destination);
    writer.Write(report);
} // Dispose() may block the thread doing async cleanup work
```

## Good

```csharp
public async Task WriteReportAsync(Stream destination, Report report)
{
    await using var writer = new Utf8JsonAsyncWriter(destination);
    await writer.WriteAsync(report);
} // DisposeAsync() awaited - no thread blocked on I/O

// A type can implement both interfaces; await using picks DisposeAsync
public async Task QueryAsync(string connectionString)
{
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync();

    await using var command = connection.CreateCommand();
    command.CommandText = "SELECT Id FROM Users";

    await using var reader = await command.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        Consume(reader.GetInt32(0));
    }
}
```

## Implementing IAsyncDisposable

```csharp
public sealed class AsyncResource : IAsyncDisposable
{
    private readonly Socket _socket;

    public AsyncResource(Socket socket) => _socket = socket;

    public async ValueTask DisposeAsync()
    {
        await _socket.DisconnectAsync(reuseSocket: false);
        _socket.Dispose();
    }
}
```

## Mixing Sync and Async Disposal

```csharp
// If a type implements both, prefer await using in async methods
public sealed class HybridResource : IDisposable, IAsyncDisposable
{
    public void Dispose() { /* fast, sync-only cleanup */ }

    public async ValueTask DisposeAsync()
    {
        await FlushAsync();
        Dispose();
        GC.SuppressFinalize(this);
    }
}
```

## See Also

- [mem-using-declaration](mem-using-declaration.md) - Sync disposal
- [async-no-sync-over-async](async-no-sync-over-async.md) - Don't block on async cleanup
- [mem-dispose-pattern](mem-dispose-pattern.md) - Full dispose pattern
