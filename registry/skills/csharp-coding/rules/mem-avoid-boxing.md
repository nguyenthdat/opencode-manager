# mem-avoid-boxing

> Avoid boxing value types into `object`, non-generic collections, or interface references in hot paths

## Why It Matters

Boxing copies a value type onto the heap and allocates a new object every time it happens. It's easy to trigger accidentally: passing an `int` to a non-generic collection, to `params object[]`, or assigning it to an interface-typed variable. In hot loops this creates significant, hidden GC pressure.

## Bad

```csharp
// Non-generic collection boxes every int added
var list = new ArrayList();
for (var i = 0; i < 1000; i++)
{
    list.Add(i); // boxes each int
}

// Interface reference on a struct boxes it
public interface IShape { double Area(); }
public struct Circle : IShape
{
    public double Radius;
    public double Area() => Math.PI * Radius * Radius;
}

IShape shape = new Circle { Radius = 2 }; // boxed - Circle copied to the heap

// string.Format/Console.WriteLine with value-type args used to box heavily pre-interpolation
Console.WriteLine("{0} items, {1} total", count, total); // boxes count and total
```

## Good

```csharp
// Generic collections never box
var list = new List<int>();
for (var i = 0; i < 1000; i++)
{
    list.Add(i); // no boxing
}

// Use generics instead of an interface-typed variable when the concrete type is known
public static double AreaOf<TShape>(TShape shape) where TShape : IShape
{
    return shape.Area(); // no boxing - constrained generic call
}

var area = AreaOf(new Circle { Radius = 2 });

// Interpolated strings avoid boxing value-type arguments (compiler emits typed overloads)
Console.WriteLine($"{count} items, {total} total");
```

## Detecting Boxing

```csharp
// Roslyn analyzer CA1838/IDE0057 and the JIT disassembly both reveal boxing.
// A quick smell test: does the code assign a value type to `object`, a non-generic
// collection, or an unconstrained interface variable? If so, it likely boxes.
```

## See Also

- [mem-struct-vs-class](mem-struct-vs-class.md) - Struct/class tradeoffs
- [anti-boxing-generic-collections](anti-boxing-generic-collections.md) - Anti-pattern reference
- [api-generic-constraints](api-generic-constraints.md) - Generic constraints instead of interfaces
