# api-out-var-pattern

> Use `out var` declarations and tuple deconstruction for multiple return values instead of `ref`/`out` boilerplate or ad-hoc wrapper classes

## Why It Matters

Declaring an `out` variable separately before the call (`int result; TryParse(text, out result);`) is verbose and separates the declaration from its meaningful use. Inline `out var` keeps the declaration at the point of use. For genuinely multiple, equally-important return values, a tuple with named elements avoids creating a throwaway class just to return two or three values.

## Bad

```csharp
int parsed;
bool success = int.TryParse(text, out parsed);
if (success)
{
    Use(parsed);
}

// Returning multiple values via a throwaway wrapper class
public class MinMaxResult
{
    public int Min { get; set; }
    public int Max { get; set; }
}

public MinMaxResult GetMinMax(int[] values)
{
    return new MinMaxResult { Min = values.Min(), Max = values.Max() };
}
```

## Good

```csharp
if (int.TryParse(text, out var parsed))
{
    Use(parsed);
}

// Named tuple return - no throwaway type needed
public (int Min, int Max) GetMinMax(int[] values) => (values.Min(), values.Max());

var (min, max) = GetMinMax(values); // deconstruction at the call site
Console.WriteLine($"{min} - {max}");

// Discard values you don't need
var (_, max2) = GetMinMax(values);
```

## Deconstructing Your Own Types

```csharp
public readonly record struct Point(double X, double Y); // records get deconstruction for free

var (x, y) = new Point(3, 4);

// Or add Deconstruct manually to a non-record type
public class Range
{
    public int Start { get; init; }
    public int End { get; init; }

    public void Deconstruct(out int start, out int end) => (start, end) = (Start, End);
}

var (start, end) = new Range { Start = 0, End = 10 };
```

## When a Real Type Is Still Better

```text
Use a named record/class instead of a tuple when the value is returned from more
than one place, crosses a public API boundary, or has more than 2-3 elements -
tuples are best for small, local, single-use groupings.
```

## See Also

- [api-record-value-data](api-record-value-data.md) - When to promote a tuple to a real type
- [type-pattern-matching-is](type-pattern-matching-is.md) - Deconstruction inside pattern matches
