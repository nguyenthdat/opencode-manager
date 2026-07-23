# api-expose-interfaces-not-impls

> Return abstractions (`IReadOnlyList<T>`, `IEnumerable<T>`, custom interfaces) from public APIs, not concrete collection types

## Why It Matters

Returning `List<T>` or `T[]` from a public API exposes implementation details (mutability, exact type) that callers can come to depend on, making it a breaking change to later switch implementations or add validation on mutation. Returning the narrowest useful interface keeps the contract honest about what callers can actually rely on.

## Bad

```csharp
public class OrderService
{
    private readonly List<Order> _orders = [];

    public List<Order> GetOrders() => _orders; // caller can Add/Remove/Clear directly!
}

var orders = orderService.GetOrders();
orders.Clear(); // silently corrupts the service's internal state
```

## Good

```csharp
public class OrderService
{
    private readonly List<Order> _orders = [];

    public IReadOnlyList<Order> GetOrders() => _orders; // read-only view, mutation impossible
}

var orders = orderService.GetOrders();
// orders.Clear(); // does not compile - IReadOnlyList<T> has no mutating members
```

## Choosing the Right Abstraction

```csharp
// IEnumerable<T>    - caller only needs to iterate once, no indexing/count needed
// IReadOnlyList<T>  - caller needs indexing and Count, but never mutation
// IReadOnlyCollection<T> - caller needs Count but not indexing
// ImmutableArray<T>/ImmutableList<T> - caller needs a guaranteed-immutable, shareable value

public IEnumerable<LogEntry> StreamLogs() // pure iteration, possibly lazy/streaming
{
    foreach (var line in File.ReadLines(_path))
    {
        yield return ParseLine(line);
    }
}

public IReadOnlyList<Order> GetOrders() => _orders; // indexable snapshot
```

## Internally, Still Use Concrete Types

```csharp
// Keep concrete, mutable types as PRIVATE implementation details -
// only the public surface needs to be an abstraction.
public class Cache
{
    private readonly Dictionary<string, object> _entries = []; // concrete internally

    public IReadOnlyDictionary<string, object> Entries => _entries; // abstraction externally
}
```

## See Also

- [immut-defensive-copy-collections](immut-defensive-copy-collections.md) - Related encapsulation concern
- [immut-avoid-mutable-public-fields](immut-avoid-mutable-public-fields.md) - Same principle for fields
- [linq-collection-choice](linq-collection-choice.md) - Picking internal collection types
