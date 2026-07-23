# async-taskcompletionsource-bridge

> Use `TaskCompletionSource<T>` to adapt callback/event-based APIs into awaitable `Task<T>`

## Why It Matters

Older or event-driven APIs (SDKs with `On...Completed` events, raw socket callbacks) don't return `Task`. Wrapping them by hand with blocking waits defeats the purpose of async. `TaskCompletionSource<T>` gives you a `Task` whose completion you control explicitly, letting you bridge any callback-style API into the async/await world correctly.

## Bad

```csharp
public string FetchLegacy(string key)
{
    string? result = null;
    using var done = new ManualResetEventSlim();

    _legacyClient.FetchCompleted += (_, value) =>
    {
        result = value;
        done.Set();
    };
    _legacyClient.BeginFetch(key);

    done.Wait(); // blocks a thread pool thread the whole time
    return result!;
}
```

## Good

```csharp
public Task<string> FetchLegacyAsync(string key)
{
    var tcs = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);

    void Handler(object? sender, string value)
    {
        _legacyClient.FetchCompleted -= Handler;
        tcs.TrySetResult(value);
    }

    _legacyClient.FetchCompleted += Handler;
    _legacyClient.BeginFetch(key);

    return tcs.Task;
}

// Caller uses it like any other async method - no thread blocked waiting
var value = await FetchLegacyAsync("config-key");
```

## Handling Errors and Cancellation

```csharp
public Task<string> FetchWithErrorsAsync(string key, CancellationToken cancellationToken)
{
    var tcs = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);

    cancellationToken.Register(() => tcs.TrySetCanceled(cancellationToken));

    void OnCompleted(object? sender, string value) => tcs.TrySetResult(value);
    void OnFailed(object? sender, Exception ex) => tcs.TrySetException(ex);

    _legacyClient.FetchCompleted += OnCompleted;
    _legacyClient.FetchFailed += OnFailed;
    _legacyClient.BeginFetch(key);

    return tcs.Task;
}
```

## Always Use RunContinuationsAsynchronously

```text
Without TaskCreationOptions.RunContinuationsAsynchronously, continuations
(the code after your await) can run synchronously on the thread that calls
TrySetResult - potentially the legacy library's own callback thread, which may
not expect to run arbitrary user continuations. Always pass this option.
```

## See Also

- [async-channels-producer-consumer](async-channels-producer-consumer.md) - A higher-level alternative for streams of values
- [async-no-sync-over-async](async-no-sync-over-async.md) - Why the blocking version is a problem
