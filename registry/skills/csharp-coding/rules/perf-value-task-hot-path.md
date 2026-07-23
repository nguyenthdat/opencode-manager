# perf-value-task-hot-path

> Return `ValueTask`/`ValueTask<T>` from hot async methods that usually complete synchronously

## Why It Matters

`Task<T>` allocates a heap object for every call, even when the underlying async state machine completes synchronously (e.g. a cache hit). For a method called at very high frequency where the synchronous path dominates (a cache lookup, a buffered reader), `ValueTask<T>` avoids that allocation on the fast path while still supporting the (rarer) truly asynchronous path.

## Bad

```csharp
public async Task<CachedItem?> GetAsync(string key)
{
    if (_cache.TryGetValue(key, out var item))
    {
        return item; // still allocates a Task<CachedItem?> wrapper for this synchronous return
    }
    return await LoadAndCacheAsync(key);
}
```

## Good

```csharp
public ValueTask<CachedItem?> GetAsync(string key)
{
    if (_cache.TryGetValue(key, out var item))
    {
        return ValueTask.FromResult(item); // no Task allocation on the common, synchronous path
    }
    return new ValueTask<CachedItem?>(LoadAndCacheAsync(key)); // allocates only on the rare miss path
}

private async Task<CachedItem?> LoadAndCacheAsync(string key)
{
    var item = await _repository.LoadAsync(key);
    _cache[key] = item;
    return item;
}
```

## Measure First - This Is a Targeted Optimization

```text
ValueTask adds real usage constraints (see async-valuetask-single-await) for a
benefit that only matters at high call frequency with a genuinely-often-
synchronous path. Apply this to methods proven hot via profiling, not
speculatively across the whole codebase.
```

## IValueTaskSource for Advanced, Zero-Allocation Async (Rare)

```csharp
// For extremely performance-sensitive infrastructure code (e.g. a custom socket
// transport), ValueTask can be backed by a pooled IValueTaskSource<T>
// implementation to avoid allocating even on the asynchronous path - this is
// an advanced, narrow technique used by libraries like Kestrel, not typical
// application code.
```

## See Also

- [async-task-vs-valuetask](async-task-vs-valuetask.md) - The broader decision this rule specializes
- [async-valuetask-single-await](async-valuetask-single-await.md) - Usage constraints you take on with ValueTask
