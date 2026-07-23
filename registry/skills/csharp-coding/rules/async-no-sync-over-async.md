# async-no-sync-over-async

> Never block on async code with `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()`

## Why It Matters

Blocking synchronously on a `Task` can deadlock when a `SynchronizationContext` is present (classic ASP.NET, WPF, WinForms): the continuation needs to resume on that context's thread, but that thread is the one blocked waiting for the result. Even without a deadlock, it wastes a thread pool thread doing nothing but waiting, hurting throughput under load.

## Bad

```csharp
public string GetData()
{
    // Blocks the calling thread; can deadlock under a SynchronizationContext,
    // and always wastes a thread even when it doesn't deadlock.
    return FetchDataAsync().Result;
}

public void Save()
{
    SaveAsync().Wait();
}
```

## Good

```csharp
public async Task<string> GetDataAsync() => await FetchDataAsync();

public async Task SaveAsync() => await SaveInternalAsync();

// If you truly are at a synchronous entry point (e.g. Main), make it async instead
public static async Task Main(string[] args)
{
    await RunAsync();
}
```

## When You're Stuck With a Sync API Boundary

```csharp
// If a synchronous interface member absolutely cannot become async (e.g. implementing
// a third-party sync interface you don't control), isolate the block and document why -
// this is a last resort, not a routine pattern.
public string LegacySyncMethod()
{
    // Justification: ILegacyPlugin.Load() is a fixed sync contract we don't own.
    // Safe here because this runs on a background worker with no SynchronizationContext.
    return Task.Run(() => FetchDataAsync()).GetAwaiter().GetResult();
}
```

## Detecting It

```csharp
// Roslyn analyzer VSTHRD002 (Microsoft.VisualStudio.Threading.Analyzers) and
// a banned-API analyzer entry for Task.Result / Task.Wait / GetAwaiter().GetResult()
// catch this reliably in CI - see lint-banned-api-analyzer.
```

## See Also

- [async-configureawait-false-lib](async-configureawait-false-lib.md) - Reduces (but doesn't eliminate) the deadlock risk
- [async-avoid-task-run-server](async-avoid-task-run-server.md) - A related server-side anti-pattern
- [anti-sync-over-async](anti-sync-over-async.md) - Anti-pattern reference
