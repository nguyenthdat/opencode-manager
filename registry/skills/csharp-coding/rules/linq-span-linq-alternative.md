# linq-span-linq-alternative

> Replace LINQ with manual loops or `Span<T>` operations only when profiling shows LINQ is the bottleneck

## Why It Matters

LINQ is clear, composable, and fast enough for the overwhelming majority of code. Rewriting it into manual loops "for performance" without measurement trades readability for a speculative, often negligible gain - and sometimes makes things worse if it defeats provider-side query translation (EF Core) or JIT optimizations that already handle common LINQ patterns well.

## Bad

```csharp
// Rewritten to a manual loop pre-emptively, in ordinary application code that's
// called once per user action - no measured performance problem here at all.
public decimal TotalOf(List<Order> orders)
{
    var total = 0m;
    for (var i = 0; i < orders.Count; i++)
    {
        if (orders[i].IsValid)
        {
            total += orders[i].Amount;
        }
    }
    return total;
}
// Harder to read than the LINQ equivalent, for a call site that was never a bottleneck.
```

## Good

```csharp
// Ordinary code: keep the clear, composable LINQ version
public decimal TotalOf(List<Order> orders) =>
    orders.Where(o => o.IsValid).Sum(o => o.Amount);

// Only after BenchmarkDotNet/profiling shows this exact call site is hot AND
// LINQ's overhead is the measured cause, switch to a manual loop or Span<T>:
public decimal TotalOfHotPath(ReadOnlySpan<Order> orders)
{
    var total = 0m;
    foreach (var order in orders)
    {
        if (order.IsValid) total += order.Amount;
    }
    return total;
}
```

## A Measured Example

```csharp
[MemoryDiagnoser]
public class SumBenchmarks
{
    private Order[] _orders = GenerateOrders(10_000);

    [Benchmark(Baseline = true)]
    public decimal Linq() => _orders.Where(o => o.IsValid).Sum(o => o.Amount);

    [Benchmark]
    public decimal Manual()
    {
        var total = 0m;
        foreach (var o in _orders)
        {
            if (o.IsValid) total += o.Amount;
        }
        return total;
    }
}
// Only act on the result if it shows a meaningful, real-world-relevant difference.
```

## See Also

- [perf-avoid-linq-hot-path](perf-avoid-linq-hot-path.md) - The performance-category counterpart
- [linq-avoid-hot-path](linq-avoid-hot-path.md) - Related allocation-avoidance guidance
- [mem-span-zero-alloc](mem-span-zero-alloc.md) - Span-based alternatives for proven hot paths
