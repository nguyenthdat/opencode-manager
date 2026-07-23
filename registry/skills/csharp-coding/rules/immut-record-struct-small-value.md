# immut-record-struct-small-value

> Use `record struct` for small, copyable, immutable value types instead of `record` (class)

## Why It Matters

A `record` is a reference type - every instance is heap-allocated. For small, frequently-created value types (coordinates, RGB colors, small money/quantity pairs), a `record struct` gives you the same generated `Equals`/`GetHashCode`/`ToString`/`with` support as a `record`, but with value-type semantics: stack allocation, copy-by-value, no GC pressure.

## Bad

```csharp
public record Point(double X, double Y); // reference type - heap-allocates every instance

public double DistanceBetween(Point[] points)
{
    var total = 0.0;
    for (var i = 1; i < points.Length; i++)
    {
        // Every Point in this array is a separate heap object with pointer indirection
        total += Distance(points[i - 1], points[i]);
    }
    return total;
}
```

## Good

```csharp
public readonly record struct Point(double X, double Y); // value type - no heap allocation

public double DistanceBetween(Point[] points)
{
    var total = 0.0;
    for (var i = 1; i < points.Length; i++)
    {
        total += Distance(points[i - 1], points[i]); // array stores Points inline, contiguous memory
    }
    return total;
}
```

## Mutable record struct (Use Sparingly)

```csharp
// record struct is mutable by default unless marked readonly - prefer readonly
// record struct for value objects; only drop readonly for genuinely mutable
// value-type accumulators (rare).
public record struct Accumulator(int Count, double Sum)
{
    public void Add(double value)
    {
        Count++;
        Sum += value;
    }
}
```

## Choosing record vs record struct

```text
record struct: small (rule of thumb: <= 16-24 bytes), no shared/aliased mutation needed,
               created/copied very frequently (hot paths, large arrays of values)
record:        larger data, needs reference semantics for sharing, or is rarely
               allocated in hot loops
```

## See Also

- [api-record-value-data](api-record-value-data.md) - Records overview
- [mem-readonly-struct](mem-readonly-struct.md) - Why `readonly` matters for structs specifically
- [mem-struct-vs-class](mem-struct-vs-class.md) - The general struct-vs-class decision
