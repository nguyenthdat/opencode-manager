# type-pattern-matching-is

> Use pattern matching (`is`, `switch` expressions, property/list patterns) instead of type-casting chains and nested `if`s

## Why It Matters

Modern C# pattern matching lets you test a type, extract its value, and check conditions on that value in a single expression - replacing the older `is` + separate cast, or long `if/else if` chains checking `GetType()`. It's more concise, avoids redundant casts, and the compiler can check exhaustiveness for `switch` expressions over closed type hierarchies.

## Bad

```csharp
public string Describe(object shape)
{
    if (shape is Circle)
    {
        var circle = (Circle)shape; // separate cast after the type check
        if (circle.Radius > 10)
        {
            return "large circle";
        }
        return "circle";
    }
    else if (shape is Rectangle)
    {
        var rect = (Rectangle)shape;
        return $"{rect.Width}x{rect.Height} rectangle";
    }
    return "unknown shape";
}
```

## Good

```csharp
public string Describe(object shape) => shape switch
{
    Circle { Radius: > 10 } => "large circle",       // property pattern + relational pattern
    Circle => "circle",
    Rectangle { Width: var w, Height: var h } => $"{w}x{h} rectangle",
    _ => "unknown shape"
};
```

## `is` With Pattern-Based Extraction

```csharp
if (shape is Circle { Radius: var radius } && radius > 10)
{
    Console.WriteLine($"Large circle with radius {radius}");
}

// Combine type check + null check + property check in one expression
if (order is { Status: OrderStatus.Shipped, TrackingNumber: not null } shipped)
{
    Notify(shipped.TrackingNumber);
}
```

## List Patterns (C# 11+)

```csharp
string Summarize(int[] values) => values switch
{
    [] => "empty",
    [var single] => $"one value: {single}",
    [var first, .., var last] => $"starts at {first}, ends at {last}",
    _ => "several values"
};
```

## Logical Patterns (`and`, `or`, `not`)

```csharp
bool IsValidPort(int port) => port is > 0 and <= 65535;
bool IsWeekday(DayOfWeek day) => day is not (DayOfWeek.Saturday or DayOfWeek.Sunday);
```

## See Also

- [type-switch-expression-exhaustive](type-switch-expression-exhaustive.md) - Exhaustiveness in switch expressions
- [api-out-var-pattern](api-out-var-pattern.md) - Deconstruction, related to pattern matching
- [immut-positional-record-deconstruct](immut-positional-record-deconstruct.md) - Records pattern-match especially well
