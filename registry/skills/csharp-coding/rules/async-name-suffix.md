# async-name-suffix

> Suffix asynchronous methods with `Async`

## Why It Matters

The `Async` suffix is a long-standing .NET convention (formalized in the Task-based Asynchronous Pattern guidelines) that lets callers immediately recognize a method returns a `Task`/`Task<T>`/`ValueTask`/`IAsyncEnumerable<T>` and should be awaited. Without it, sync and async overloads become ambiguous and easy to call incorrectly.

## Bad

```csharp
public class UserService
{
    public Task<User> GetUser(int id) => _repository.FindAsync(id); // missing Async suffix

    public Task Save(User user) => _repository.SaveAsync(user);
}

var user = userService.GetUser(1); // looks synchronous - easy to forget to await
```

## Good

```csharp
public class UserService
{
    public Task<User> GetUserAsync(int id) => _repository.FindAsync(id);

    public Task SaveAsync(User user) => _repository.SaveAsync(user);
}

var user = await userService.GetUserAsync(1); // the name signals "you must await this"
```

## Sync/Async Overload Pairs

```csharp
public class Repository
{
    public User Get(int id) => GetCore(id);              // synchronous
    public Task<User> GetAsync(int id) => GetCoreAsync(id); // asynchronous

    // The Async suffix is what disambiguates these two overloads at the call site
}
```

## Exceptions to the Rule

```text
- Event handlers stay named by their event (OnClick, not OnClickAsync), even if
  implemented as async void per platform convention.
- Some minimal API/route handler delegates omit it by convention where the
  framework's own samples do (team style call), but library-facing public
  methods should still follow the Async suffix convention.
```

## See Also

- [async-no-async-void](async-no-async-void.md) - Related async method design
- [name-async-suffix](name-async-suffix.md) - The naming-conventions-category counterpart
