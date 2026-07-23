# mem-readonly-struct

> Mark immutable structs `readonly struct` and their instance methods `readonly` where possible

## Why It Matters

Without `readonly struct`, the compiler must defensively copy a struct before calling any method through a `readonly` reference (e.g. `in` parameters, `readonly` fields), because it cannot prove the method won't mutate it. `readonly struct` makes immutability a compiler-enforced contract, eliminating those hidden defensive copies.

## Bad

```csharp
public struct Point
{
    public double X { get; set; }
    public double Y { get; set; }

    public double Length() => Math.Sqrt(X * X + Y * Y);
}

public readonly struct Line
{
    private readonly Point _start; // Point is mutable - defensive copy on every access

    public double StartLength() => _start.Length(); // hidden copy of _start
}
```

## Good

```csharp
public readonly struct Point
{
    public double X { get; }
    public double Y { get; }

    public Point(double x, double y) => (X, Y) = (x, y);

    // readonly is implied for all members in a readonly struct
    public double Length() => Math.Sqrt(X * X + Y * Y);

    public Point WithX(double x) => new(x, Y); // "mutation" returns a new value
}

public readonly struct Line
{
    private readonly Point _start;
    private readonly Point _end;

    public Line(Point start, Point end) => (_start, _end) = (start, end);

    public double StartLength() => _start.Length(); // no defensive copy - Point is readonly
}
```

## Partial Readonly Members

```csharp
// A mutable struct can still mark individual members readonly
public struct Counter
{
    private int _count;

    public void Increment() => _count++; // mutates, cannot be readonly

    public readonly int Current => _count; // read-only accessor, no defensive copy needed
}
```

## See Also

- [mem-struct-vs-class](mem-struct-vs-class.md) - When a struct is the right choice at all
- [immut-record-struct-small-value](immut-record-struct-small-value.md) - `record struct` gives this for free
- [mem-ref-struct-stack](mem-ref-struct-stack.md) - Stack-only structs
