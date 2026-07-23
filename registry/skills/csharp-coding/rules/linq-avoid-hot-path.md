# linq-avoid-hot-path

> Avoid LINQ's allocation overhead (iterators, closures, delegates) in latency-sensitive hot paths

## Why It Matters

LINQ operators allocate: enumerator state machines, closures for captured variables in lambdas, and delegate instances. In a method called millions of times per second (a game loop, a high-throughput message processor, a parsing inner loop), this overhead is measurable and a plain `for` loop can be meaningfully faster with zero allocations.

## Bad

```csharp
// Called per-message in a high-throughput pipeline processing millions of messages/sec
public bool HasError(Message[] messages)
{
    return messages.Any(m => m.Level == LogLevel.Error); // allocates a delegate + enumerator per call
}

public decimal SumAmounts(Order[] orders)
{
    return orders.Where(o => o.IsValid).Sum(o => o.Amount); // two allocating LINQ chains
}
```

## Good

```csharp
public bool HasError(Message[] messages)
{
    foreach (var m in messages)
    {
        if (m.Level == LogLevel.Error) return true;
    }
    return false; // no allocations, short-circuits identically to Any()
}

public decimal SumAmounts(Order[] orders)
{
    var total = 0m;
    foreach (var o in orders)
    {
        if (o.IsValid) total += o.Amount;
    }
    return total;
}
```

## Measure Before You Rewrite

```text
This is a targeted rule for PROVEN hot paths (profiled with BenchmarkDotNet or
production telemetry showing allocation/GC pressure from this specific call site).
LINQ is perfectly fine - and usually clearer - for the vast majority of code that
isn't called at extreme frequency. Don't rewrite ordinary application code into
manual loops "just in case."
```

## Static Lambdas Reduce (Not Eliminate) Overhead

```csharp
// A lambda with no captured variables can be cached by the compiler instead of
// allocated per call - marking it `static` enforces that it captures nothing.
orders.Where(static o => o.IsValid).Sum(static o => o.Amount);
// Still allocates enumerator objects for the LINQ chain itself, but avoids
// re-allocating the delegate/closure on every call.
```

## See Also

- [perf-avoid-linq-hot-path](perf-avoid-linq-hot-path.md) - The performance-category counterpart with more detail
- [mem-span-zero-alloc](mem-span-zero-alloc.md) - Complementary zero-allocation technique
- [anti-linq-multiple-enumeration](anti-linq-multiple-enumeration.md) - A related LINQ performance anti-pattern
