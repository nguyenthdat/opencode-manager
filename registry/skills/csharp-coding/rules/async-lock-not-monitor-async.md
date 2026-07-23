# async-lock-not-monitor-async

> Never hold a non-reentrant, thread-affine lock (`lock`/`Monitor`) across an `await`; use `SemaphoreSlim` or, on .NET 9+, `System.Threading.Lock`

## Why It Matters

`Monitor`-based locks (the `lock` statement) track ownership by thread. An `await` can resume its continuation on a *different* thread than the one that entered the lock, which breaks `Monitor`'s exit checks and can throw `SynchronizationLockException`, or - if it doesn't throw - silently produce incorrect concurrency behavior. The compiler already forbids `await` directly inside a `lock` block; the risk here is refactoring a lock's contents to indirectly call async code.

## Bad

```csharp
private readonly object _gate = new();

public void Update()
{
    lock (_gate)
    {
        RunSynchronousStep();
        CallHelperThatSecretlyBlocksOnAsync(); // hides a sync-over-async call inside the lock
    }
}

private void CallHelperThatSecretlyBlocksOnAsync()
{
    SaveAsync().GetAwaiter().GetResult(); // combines two anti-patterns at once
}
```

## Good

```csharp
private readonly SemaphoreSlim _gate = new(1, 1);

public async Task UpdateAsync()
{
    await _gate.WaitAsync();
    try
    {
        RunSynchronousStep();
        await SaveAsync(); // safe - SemaphoreSlim has no thread-affinity requirement
    }
    finally
    {
        _gate.Release();
    }
}
```

## .NET 9+: System.Threading.Lock

```csharp
// .NET 9 introduces a dedicated Lock type, still synchronous-only (no async support),
// but faster than Monitor for purely synchronous critical sections. It does NOT
// solve the "need to await inside" problem - use SemaphoreSlim for that.
private readonly Lock _gate = new();

public void UpdateSync()
{
    using (_gate.EnterScope())
    {
        RunSynchronousStep(); // still must be entirely synchronous
    }
}
```

## See Also

- [async-semaphoreslim-lock](async-semaphoreslim-lock.md) - The async-safe replacement
- [async-no-sync-over-async](async-no-sync-over-async.md) - The blocking-call half of this anti-pattern
- [anti-sync-over-async](anti-sync-over-async.md) - Anti-pattern reference
