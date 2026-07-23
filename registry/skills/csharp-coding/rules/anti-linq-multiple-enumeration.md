# anti-linq-multiple-enumeration

> Don't enumerate the same `IEnumerable<T>` query multiple times

## Why It Matters

Each enumeration of a lazy LINQ query re-runs the entire pipeline from its source. Enumerating the same sequence more than once repeats potentially expensive work (a database call, a file read) and can even change behavior for one-shot sources that can't be re-enumerated at all.

## Bad

```csharp
public void PrintSummary(IEnumerable<Order> orders)
{
    Console.WriteLine($"Count: {orders.Count()}");        // enumeration #1
    Console.WriteLine($"Total: {orders.Sum(o => o.Total)}"); // enumeration #2 - reruns the whole query

    foreach (var order in orders) Console.WriteLine(order.Id); // enumeration #3
}
```

## Good

```csharp
public void PrintSummary(IEnumerable<Order> orders)
{
    var materialized = orders.ToList(); // one enumeration, reused freely afterward

    Console.WriteLine($"Count: {materialized.Count}");
    Console.WriteLine($"Total: {materialized.Sum(o => o.Total)}");

    foreach (var order in materialized) Console.WriteLine(order.Id);
}
```

## Roslyn Catches This

```text
CA1851/CA1826 flag possible multiple enumeration of an IEnumerable<T> -
enable them via AnalysisLevel/AnalysisMode (see lint-roslyn-analyzers) to
catch this automatically in CI.
```

## See Also

- [linq-avoid-multiple-enumeration](linq-avoid-multiple-enumeration.md) - The full rule with more detail
- [linq-deferred-execution-aware](linq-deferred-execution-aware.md) - Why this happens at all
