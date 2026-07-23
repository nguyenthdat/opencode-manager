# anti-boxing-generic-collections

> Don't box value types into `object`-typed fields or non-generic collections

## Why It Matters

Every value type stored in a non-generic collection (`ArrayList`, `Hashtable`) or assigned to an `object`-typed variable is heap-allocated (boxed) on the spot. In a loop processing many values, this creates significant, easily-avoidable GC pressure that a generic collection eliminates entirely.

## Bad

```csharp
var list = new ArrayList();
for (var i = 0; i < 10_000; i++)
{
    list.Add(i); // boxes every single int
}

public interface IShape { double Area(); }
public struct Circle : IShape { public double Radius; public double Area() => Math.PI * Radius * Radius; }

IShape shape = new Circle { Radius = 2 }; // boxed the moment it's assigned to the interface-typed variable
```

## Good

```csharp
var list = new List<int>();
for (var i = 0; i < 10_000; i++)
{
    list.Add(i); // no boxing - List<int> stores ints inline
}

public static double AreaOf<TShape>(TShape shape) where TShape : IShape =>
    shape.Area(); // no boxing - constrained generic call operates on the value type directly

var area = AreaOf(new Circle { Radius = 2 });
```

## See Also

- [mem-avoid-boxing](mem-avoid-boxing.md) - The full rule with more detail
- [api-generic-constraints](api-generic-constraints.md) - Using generics instead of interface-typed variables
