# name-generic-type-param-t

> Use `T`/`TKey`/`TValue`/`TResult`/`TEntity` conventions for generic type parameters

## Why It Matters

.NET's generic type parameter naming convention - a single `T` for a lone parameter, or a descriptive `T`-prefixed name for multiple parameters - is what every BCL generic type uses (`Dictionary<TKey, TValue>`, `Func<T, TResult>`). Following it means your generics read naturally next to the BCL and to any other .NET code.

## Bad

```csharp
public class Cache<KeyType, ValType> // should be TKey, TValue
{
    public ValType Get(KeyType key) => default!;
}

public interface Repository<Entity> // should be TEntity
{
    Entity GetById(int id);
}
```

## Good

```csharp
public class Cache<TKey, TValue> where TKey : notnull
{
    public TValue? Get(TKey key) => default;
}

public interface IRepository<TEntity> where TEntity : class
{
    TEntity? GetById(int id);
}

// A single, unambiguous type parameter can just be T
public class Box<T>
{
    public T Value { get; init; } = default!;
}
```

## Descriptive Names for Multiple/Constrained Parameters

```csharp
public delegate TResult Transformer<TInput, TResult>(TInput input);

public class Repository<TEntity, TId>
    where TEntity : IEntity<TId>
    where TId : notnull
{
    public TEntity? GetById(TId id) => default;
}
```

## See Also

- [api-generic-constraints](api-generic-constraints.md) - Constraining generics, not just naming them
- [name-pascalcase-public](name-pascalcase-public.md) - General naming conventions
