# perf-record-struct-hot-data

> Use `record struct` for small, immutable data copied frequently in hot paths

## Why It Matters

A `record` (reference type) allocates on the heap and requires pointer indirection for every access. In a hot path that creates or copies many small value-like objects (per-pixel data, per-tick simulation state, per-message parsing results), a `record struct` keeps that data inline in arrays/stack frames, eliminating both the allocation and the indirection.

## Bad

```csharp
public record PricePoint(DateTime Timestamp, decimal Price); // reference type

public decimal ComputeMovingAverage(IReadOnlyList<PricePoint> ticks, int window)
{
    // Every PricePoint in `ticks` is a separate heap object with pointer chasing
    var sum = 0m;
    for (var i = ticks.Count - window; i < ticks.Count; i++)
    {
        sum += ticks[i].Price;
    }
    return sum / window;
}
```

## Good

```csharp
public readonly record struct PricePoint(DateTime Timestamp, decimal Price); // value type

public decimal ComputeMovingAverage(ReadOnlySpan<PricePoint> ticks, int window)
{
    // ticks is a contiguous block of memory - no per-element heap indirection
    var sum = 0m;
    for (var i = ticks.Length - window; i < ticks.Length; i++)
    {
        sum += ticks[i].Price;
    }
    return sum / window;
}
```

## Measure the Actual Struct Size

```csharp
// A record struct with many/large fields can itself become expensive to copy -
// verify the size stays small before committing to this in a hot path.
[Fact]
public void PricePoint_StaysSmall()
{
    Assert.True(Unsafe.SizeOf<PricePoint>() <= 24, "PricePoint grew too large for hot-path copying.");
}
```

## Combine With Arrays/Span for Cache-Friendly Layout

```csharp
// An array of record structs stores all the data contiguously (struct-of-arrays-
// adjacent benefits) - iterating it is far more cache-friendly than an array
// of references to separately-allocated record instances.
PricePoint[] ticks = new PricePoint[10_000];
```

## See Also

- [immut-record-struct-small-value](immut-record-struct-small-value.md) - The general-purpose treatment of this pattern
- [mem-struct-vs-class](mem-struct-vs-class.md) - The broader struct-vs-class decision
- [mem-large-object-heap](mem-large-object-heap.md) - Related GC-pressure considerations
