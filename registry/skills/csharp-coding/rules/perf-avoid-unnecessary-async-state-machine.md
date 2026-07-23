# perf-avoid-unnecessary-async-state-machine

> Avoid generating an async state machine for methods that are actually synchronous

## Why It Matters

Every `async` method the compiler processes generates a state machine (a struct or class implementing `IAsyncStateMachine`) to track suspension points, plus a `Task`/builder to represent the eventual result. When a method never actually awaits anything meaningful - or only awaits one call it could return directly - that machinery is pure overhead with zero benefit.

## Bad

```csharp
public async Task<int> GetCachedCountAsync()
{
    return _cache.Count; // never awaits anything - still gets a full async state machine and a Task wrapper
}

public async Task<User> GetUserAsync(int id)
{
    return await _repository.FindAsync(id); // single await with no other work - unnecessary state machine
}
```

## Good

```csharp
public Task<int> GetCachedCountAsync() => Task.FromResult(_cache.Count); // no state machine at all

public Task<User> GetUserAsync(int id) => _repository.FindAsync(id); // passes the Task straight through
```

## Keep `async`/`await` Only When It Does Real Work

```csharp
// Genuinely needs the state machine: work happens both before AND after the await,
// or a try/catch/using spans the awaited call.
public async Task<User> GetUserAndAuditAsync(int id)
{
    await _auditLog.RecordAsync($"Fetching user {id}");
    var user = await _repository.FindAsync(id);
    await _auditLog.RecordAsync($"Fetched user {id}");
    return user;
}
```

## Synchronous Fast Path, Asynchronous Fallback

```csharp
public Task<CachedItem?> GetAsync(string key)
{
    if (_cache.TryGetValue(key, out var item))
    {
        return Task.FromResult(item); // synchronous result, no state machine needed for this path
    }
    return LoadAndCacheAsync(key); // only THIS path pays for the state machine, and only when truly needed
}

private async Task<CachedItem?> LoadAndCacheAsync(string key)
{
    var item = await _repository.LoadAsync(key);
    _cache[key] = item;
    return item;
}
```

## See Also

- [async-return-task-directly](async-return-task-directly.md) - The async-category treatment of this same rule
- [perf-value-task-hot-path](perf-value-task-hot-path.md) - Reducing allocation further with ValueTask
