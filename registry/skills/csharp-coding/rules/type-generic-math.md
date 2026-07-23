# type-generic-math

> Use generic math (`INumber<T>` and related interfaces, .NET 7+) for numeric-agnostic algorithms

## Why It Matters

Before generic math, writing an algorithm that worked over `int`, `double`, `decimal`, etc. meant either duplicating the method per type or falling back to `dynamic`/boxing-heavy reflection. Generic math interfaces (`INumber<T>`, `IAdditionOperators<T,T,T>`, `IComparable<T>`, and more) let you write one generic implementation that the compiler specializes per numeric type with zero boxing.

## Bad

```csharp
public static int Sum(IEnumerable<int> values) => values.Aggregate(0, (a, b) => a + b);
public static double Sum(IEnumerable<double> values) => values.Aggregate(0.0, (a, b) => a + b);
public static decimal Sum(IEnumerable<decimal> values) => values.Aggregate(0m, (a, b) => a + b);
// Same algorithm, duplicated per numeric type
```

## Good

```csharp
public static T Sum<T>(IEnumerable<T> values) where T : INumber<T>
{
    var total = T.Zero;
    foreach (var value in values)
    {
        total += value; // valid for ANY type implementing INumber<T>: int, double, decimal, custom types...
    }
    return total;
}

var intTotal = Sum([1, 2, 3]);          // T = int
var decimalTotal = Sum([1.5m, 2.5m]);   // T = decimal
```

## Useful Generic Math Interfaces

```csharp
INumber<T>              // full numeric operations: +, -, *, /, comparisons, Zero, One
IAdditionOperators<T,T,T> // just +
IComparisonOperators<T,T,bool> // <, >, <=, >=
IMinMaxValue<T>          // T.MinValue / T.MaxValue
IParsable<T>             // T.Parse(string, IFormatProvider?)
```

## A Generic Clamp Using IComparisonOperators

```csharp
public static T Clamp<T>(T value, T min, T max) where T : IComparisonOperators<T, T, bool>
{
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

var clamped = Clamp(150, 0, 100); // works for int, double, custom comparable types, etc.
```

## See Also

- [api-generic-constraints](api-generic-constraints.md) - Generic constraints in general
- [mem-avoid-boxing](mem-avoid-boxing.md) - Why this avoids boxing compared to `object`-based numeric code
