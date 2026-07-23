# perf-avoid-linq-hot-path

> Avoid LINQ's allocation and indirection overhead in proven, hot, per-request or per-frame code paths

## Why It Matters

LINQ operators allocate enumerator objects, closures for captured lambda state, and delegate instances, and add virtual dispatch through `IEnumerable<T>` abstraction layers. In ordinary code this overhead is invisible; in a path executed millions of times per second (a serializer's inner loop, a game's per-frame update, a high-throughput message processor) it becomes measurable GC pressure and CPU time.

## Bad

```csharp
// Called once per incoming message in a system processing 500,000 msg/sec
public bool ShouldRoute(Message message, RoutingTable table)
{
    return table.Rules
        .Where(r => r.IsActive)
        .Select(r => r.Pattern)
        .Any(pattern => message.Topic.StartsWith(pattern)); // allocates on every single call
}
```

## Good

```csharp
public bool ShouldRoute(Message message, RoutingTable table)
{
    var rules = table.Rules; // avoid re-fetching a property/field repeatedly if it's non-trivial
    for (var i = 0; i < rules.Count; i++)
    {
        var rule = rules[i];
        if (rule.IsActive && message.Topic.StartsWith(rule.Pattern, StringComparison.Ordinal))
        {
            return true; // short-circuits identically to Any(), zero allocations
        }
    }
    return false;
}
```

## Verify With BenchmarkDotNet Before Committing to This

```csharp
[MemoryDiagnoser]
public class RoutingBenchmarks
{
    [Benchmark(Baseline = true)]
    public bool Linq() => ShouldRouteLinq(_message, _table);

    [Benchmark]
    public bool Manual() => ShouldRouteManual(_message, _table);
}
// Only replace LINQ with manual loops where the benchmark shows a REAL,
// relevant difference for YOUR workload - don't guess.
```

## Precompute What You Can Outside the Hot Loop

```csharp
// If `table.Rules` rarely changes, precompute a flattened, hot-path-friendly
// structure (e.g. a plain array or a Trie) once, instead of re-filtering it
// with LINQ on every single incoming message.
```

## See Also

- [linq-avoid-hot-path](linq-avoid-hot-path.md) - The LINQ-category counterpart with more examples
- [mem-span-zero-alloc](mem-span-zero-alloc.md) - Complementary zero-allocation techniques
- [linq-avoid-linq-in-loop-alloc](linq-avoid-linq-in-loop-alloc.md) - Hoisting invariant queries out of loops
