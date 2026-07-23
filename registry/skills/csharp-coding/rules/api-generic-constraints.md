# api-generic-constraints

> Constrain generic type parameters with `where` clauses to express only the requirements you actually need

## Why It Matters

Unconstrained generics force you to fall back to reflection or `object`-typed operations for anything beyond assignment. Precise constraints (`class`, `struct`, `notnull`, an interface, `new()`, or - for numeric code - generic math interfaces) let the compiler enforce and check usage at the call site, and let you write real logic against the type parameter instead of just passing it through.

## Bad

```csharp
public class Cache<TKey, TValue>
{
    public TValue GetOrCreate(TKey key, Func<TValue> factory)
    {
        // No constraint means we can't validate key isn't null, can't call
        // TValue's constructor, and callers get no compile-time guidance either.
        if (key == null) throw new ArgumentNullException(nameof(key)); // TKey may be a value type!
        // ...
        return factory();
    }
}
```

## Good

```csharp
public class Cache<TKey, TValue>
    where TKey : notnull        // required by Dictionary<TKey,TValue> anyway
    where TValue : new()        // lets us call new TValue() directly
{
    private readonly Dictionary<TKey, TValue> _entries = [];

    public TValue GetOrCreate(TKey key)
    {
        if (!_entries.TryGetValue(key, out var value))
        {
            value = new TValue(); // valid because of the `new()` constraint
            _entries[key] = value;
        }
        return value;
    }
}
```

## Interface Constraints for Real Behavior

```csharp
public static TResult Combine<TResult>(IEnumerable<TResult> items)
    where TResult : IAdditionOperators<TResult, TResult, TResult>, IAdditiveIdentity<TResult, TResult>
{
    var total = TResult.AdditiveIdentity;
    foreach (var item in items)
    {
        total += item; // valid thanks to generic math constraints (.NET 7+)
    }
    return total;
}
```

## Multiple Constraints and `class`/`struct`

```csharp
public sealed class Repository<TEntity> where TEntity : class, IEntity, new()
{
    // class: reference type only; IEntity: must expose the members we call;
    // new(): must have a public parameterless constructor
    public TEntity CreateDefault() => new();
}
```

## See Also

- [type-generic-math](type-generic-math.md) - Numeric-agnostic algorithms via generic constraints
- [mem-avoid-boxing](mem-avoid-boxing.md) - Constraints that avoid boxing value types
- [anti-primitive-obsession](anti-primitive-obsession.md) - Related over-genericization risk
