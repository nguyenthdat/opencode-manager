# name-async-suffix

> Suffix asynchronous methods with `Async` as part of a consistent naming convention across the codebase

## Why It Matters

Beyond the specific async-correctness angle covered elsewhere, the `Async` suffix is simply part of the standard .NET naming convention family (alongside `PascalCase` members, `I`-prefixed interfaces, etc.) - a consistent, codebase-wide rule that any .NET developer recognizes on sight, independent of any particular async pitfall it happens to help avoid.

## Bad

```csharp
public interface IUserRepository
{
    Task<User> Get(int id);           // is this sync or async? no way to tell from the name
    Task Save(User user);
    IAsyncEnumerable<User> All();     // same problem
}
```

## Good

```csharp
public interface IUserRepository
{
    Task<User> GetAsync(int id);
    Task SaveAsync(User user);
    IAsyncEnumerable<User> GetAllAsync();
}
```

## Applies Consistently Across All Async-Returning Shapes

```csharp
Task DoWorkAsync();
Task<T> ComputeAsync();
ValueTask<T> LookupAsync();
IAsyncEnumerable<T> StreamAsync();
```

## Keep Sync/Async Pairs Distinguishable

```csharp
public class Repository
{
    public User Get(int id) => GetCore(id);
    public Task<User> GetAsync(int id) => GetCoreAsync(id);
    // The suffix is what makes these two overloads unambiguous by name alone.
}
```

## See Also

- [async-name-suffix](async-name-suffix.md) - The async-correctness-focused treatment of this same convention
- [name-pascalcase-public](name-pascalcase-public.md) - General naming conventions
- [name-boolean-is-has-can](name-boolean-is-has-can.md) - Another naming-by-shape convention
