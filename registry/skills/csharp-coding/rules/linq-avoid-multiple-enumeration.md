# linq-avoid-multiple-enumeration

> Avoid enumerating the same `IEnumerable<T>` query multiple times; materialize once if you need it more than once

## Why It Matters

Each enumeration of a lazy `IEnumerable<T>` re-runs the entire query pipeline from the source. If the source is a database call, a file read, or an expensive computation, enumerating it twice means doing the expensive work twice - and if the underlying source is a one-shot stream (like a `DbDataReader`), the second enumeration might return nothing or throw.

## Bad

```csharp
public void PrintSummary(IEnumerable<Order> orders)
{
    Console.WriteLine($"Count: {orders.Count()}");       // enumeration #1
    Console.WriteLine($"Total: {orders.Sum(o => o.Total)}"); // enumeration #2 - runs the whole query again

    foreach (var order in orders) // enumeration #3
    {
        Console.WriteLine(order.Id);
    }
}
```

## Good

```csharp
public void PrintSummary(IEnumerable<Order> orders)
{
    var materialized = orders.ToList(); // one enumeration, cached in memory

    Console.WriteLine($"Count: {materialized.Count}");
    Console.WriteLine($"Total: {materialized.Sum(o => o.Total)}");

    foreach (var order in materialized)
    {
        Console.WriteLine(order.Id);
    }
}
```

## Roslyn Catches This

```text
CA1851/CA1826 and Rider/ReSharper's "possible multiple enumeration of IEnumerable"
inspection flag this pattern automatically - enable them (see lint-roslyn-analyzers)
so accidental multiple enumeration is caught in CI rather than in a profiler later.
```

## Public API Signatures: Document the Expectation

```csharp
// If a public method genuinely needs single-pass streaming semantics (e.g. very
// large sequences), document it - callers should know not to pass something
// that's expensive to enumerate more than once, or the method should
// materialize internally as shown above.
public void ProcessOnce(IEnumerable<Order> orders) // single enumeration by design
{
    foreach (var order in orders) Process(order);
}
```

## See Also

- [linq-deferred-execution-aware](linq-deferred-execution-aware.md) - The underlying mechanism
- [anti-linq-multiple-enumeration](anti-linq-multiple-enumeration.md) - Anti-pattern reference
- [linq-collection-choice](linq-collection-choice.md) - Choosing a materialized collection type
