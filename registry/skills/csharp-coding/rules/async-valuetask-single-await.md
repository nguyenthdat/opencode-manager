# async-valuetask-single-await

> Await a `ValueTask`/`ValueTask<T>` exactly once; never store it for repeated awaiting or concurrent access

## Why It Matters

Unlike `Task<T>`, a `ValueTask<T>` may wrap a pooled, reusable backing object under the hood for performance. Awaiting it twice, awaiting it concurrently from two places, or calling `.Result`/`.GetAwaiter().GetResult()` after already awaiting it are all undefined behavior that can return wrong results or throw `InvalidOperationException`.

## Bad

```csharp
public async Task DoWorkAsync(SomeAsyncSource source)
{
    ValueTask<int> valueTask = source.ReadNextAsync();

    var a = await valueTask; // first await
    var b = await valueTask; // BUG: awaiting the same ValueTask twice is undefined behavior
}

public async Task RaceAsync(SomeAsyncSource source)
{
    ValueTask<int> valueTask = source.ReadNextAsync();

    // BUG: awaiting the same ValueTask concurrently from two places
    var (a, b) = (await valueTask, await valueTask);
}
```

## Good

```csharp
public async Task DoWorkAsync(SomeAsyncSource source)
{
    var value = await source.ReadNextAsync(); // await once, use the resulting int freely
    Use(value);
    Use(value); // fine - this is just an int now, not the ValueTask
}

// Need the result in two places? Convert to Task first if you must defer awaiting.
public async Task DeferredAsync(SomeAsyncSource source)
{
    Task<int> task = source.ReadNextAsync().AsTask(); // safe to await/store multiple times
    var a = await task;
    var b = await task; // fine - Task<T> supports this
}
```

## Don't Pass a ValueTask Around as State

```csharp
// BAD: storing a ValueTask as a field invites accidental double-await or
// use-after-consumption from unrelated code paths.
public sealed class Bad
{
    private ValueTask<int> _pending; // avoid
}

// GOOD: await immediately, or convert to Task if it must be held onto.
public sealed class Good
{
    private Task<int>? _pending;

    public void Start(SomeAsyncSource source) => _pending = source.ReadNextAsync().AsTask();
}
```

## See Also

- [async-task-vs-valuetask](async-task-vs-valuetask.md) - When ValueTask is the right choice at all
- [perf-value-task-hot-path](perf-value-task-hot-path.md) - Performance-motivated ValueTask usage
