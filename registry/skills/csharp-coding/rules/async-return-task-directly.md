# async-return-task-directly

> Return the inner `Task` directly instead of wrapping it in an unnecessary `async`/`await`

## Why It Matters

An `async` method that only awaits a single call and returns its result generates a full state machine for no benefit - it adds a small but real overhead (allocation, extra continuation hop) and typically loses nothing by simply returning the inner `Task` directly. Reserve `async`/`await` for methods that actually need to do work before/after the awaited call, or need a `try/catch` around it.

## Bad

```csharp
public async Task<User> GetUserAsync(int id)
{
    return await _repository.FindAsync(id); // no other work happens here - unnecessary state machine
}

public async Task SaveAsync(User user)
{
    await _repository.SaveAsync(user);
}
```

## Good

```csharp
public Task<User> GetUserAsync(int id) => _repository.FindAsync(id); // pass the Task straight through

public Task SaveAsync(User user) => _repository.SaveAsync(user);
```

## When You Must Keep `async`/`await`

```csharp
// Any of these require the state machine, so keep async/await:

// 1. A try/catch/finally around the awaited call
public async Task<User?> TryGetUserAsync(int id)
{
    try
    {
        return await _repository.FindAsync(id);
    }
    catch (KeyNotFoundException)
    {
        return null;
    }
}

// 2. Additional work before or after the await
public async Task<User> GetUserAndLogAsync(int id)
{
    var user = await _repository.FindAsync(id);
    _logger.LogInformation("Fetched user {Id}", id);
    return user;
}

// 3. A using/await using scope that must stay open across the call
public async Task<string> ReadAllAsync(string path)
{
    await using var stream = File.OpenRead(path);
    using var reader = new StreamReader(stream);
    return await reader.ReadToEndAsync();
}
```

## Watch for ConfigureAwait Consistency

```csharp
// If the inner call needs ConfigureAwait(false) applied by convention in your library,
// passing the Task straight through still gets that behavior from the callee -
// you only need async/await locally when YOU are the one awaiting.
public Task<string> FetchAsync(string url) => _client.GetStringAsync(url);
```

## See Also

- [async-task-vs-valuetask](async-task-vs-valuetask.md) - Related Task allocation concerns
- [async-configureawait-false-lib](async-configureawait-false-lib.md) - Context-capture behavior in library code
- [name-async-suffix](name-async-suffix.md) - Naming convention for async methods
