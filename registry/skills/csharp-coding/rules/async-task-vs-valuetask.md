# async-task-vs-valuetask

> Reach for `ValueTask<T>` only on proven hot paths that frequently complete synchronously

## Why It Matters

`Task<T>` is a reference type - every async call allocates one (even when cached for completed results, allocation still happens for the state machine in many cases). `ValueTask<T>` avoids that allocation when the operation completes synchronously, but it has much stricter usage rules (can't be awaited twice, can't be accessed concurrently) and adds API complexity. Use it deliberately, not everywhere.

## Bad

```csharp
// Reaching for ValueTask "for performance" on a method that's rarely on a hot path,
// and awaited/stored in ways that violate its single-await contract.
public async ValueTask<User> GetUserAsync(int id)
{
    var user = await _db.Users.FindAsync(id); // always a real DB round-trip - never synchronous
    return user;
}

var task = GetUserAsync(1);
var a = await task;
var b = await task; // BUG: ValueTask must not be awaited more than once
```

## Good

```csharp
// Default choice: Task<T> - simple, safe, and the JIT/runtime already optimizes
// common cases well.
public async Task<User> GetUserAsync(int id) => await _db.Users.FindAsync(id);

// ValueTask<T> - reserved for a method proven (via profiling) to be called
// extremely frequently and usually complete synchronously (e.g. a cache lookup
// that only occasionally misses to a real I/O call).
public ValueTask<CachedItem> GetCachedAsync(string key)
{
    if (_cache.TryGetValue(key, out var item))
    {
        return ValueTask.FromResult(item); // synchronous path - no Task allocation
    }
    return new ValueTask<CachedItem>(LoadAndCacheAsync(key)); // async path
}

private async Task<CachedItem> LoadAndCacheAsync(string key) { /* ... */ return null!; }
```

## ValueTask Usage Rules

```csharp
// 1. Await it exactly once.
// 2. Don't call .Result or .GetAwaiter().GetResult() on it more than once either.
// 3. Don't use Task.WhenAll/WhenAny directly on ValueTask - convert with .AsTask() first.
var results = await Task.WhenAll(GetCachedAsync("a").AsTask(), GetCachedAsync("b").AsTask());

// 4. If you need to store/inspect it before awaiting, convert to Task via .AsTask().
```

## See Also

- [perf-value-task-hot-path](perf-value-task-hot-path.md) - Deeper performance guidance
- [async-avoid-task-run-server](async-avoid-task-run-server.md) - Related server-side async guidance
- [mem-struct-vs-class](mem-struct-vs-class.md) - ValueTask's struct-vs-class tradeoff in general
