# immut-positional-record-deconstruct

> Use positional records for deconstruction-friendly DTOs and pattern matching

## Why It Matters

A positional record (`record Point(double X, double Y);`) gets a primary-constructor-driven declaration, `init`-only properties, and a `Deconstruct` method all in one line - enabling tuple-style deconstruction and use directly inside `switch` pattern matches, without any manual boilerplate.

## Bad

```csharp
public class Point
{
    public double X { get; }
    public double Y { get; }

    public Point(double x, double y) => (X, Y) = (x, y);

    // Manually written just to support deconstruction
    public void Deconstruct(out double x, out double y) => (x, y) = (X, Y);
}
```

## Good

```csharp
public record Point(double X, double Y); // Deconstruct is generated automatically

var (x, y) = new Point(3, 4);
Console.WriteLine($"{x}, {y}");
```

## Deconstruction in Pattern Matching

```csharp
public static string Describe(Point p) => p switch
{
    (0, 0) => "origin",
    (var x, 0) => $"on the x-axis at {x}",
    (0, var y) => $"on the y-axis at {y}",
    var (x, y) => $"at ({x}, {y})"
};
```

## Deconstruction With `foreach`

```csharp
public record Employee(string Name, string Department);

var employees = new List<Employee>
{
    new("Ada", "Engineering"),
    new("Grace", "Engineering")
};

foreach (var (name, department) in employees)
{
    Console.WriteLine($"{name} works in {department}");
}
```

## See Also

- [api-record-value-data](api-record-value-data.md) - Records overview
- [api-out-var-pattern](api-out-var-pattern.md) - Deconstruction for multiple return values generally
- [type-pattern-matching-is](type-pattern-matching-is.md) - Pattern matching in depth
