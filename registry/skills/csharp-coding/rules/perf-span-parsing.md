# perf-span-parsing

> Parse and slice input with `Span<T>`/`ReadOnlySpan<char>` to avoid intermediate substring allocations

## Why It Matters

Parsing code often calls `Substring` repeatedly to isolate tokens before converting them - each `Substring` call allocates a new string just to be discarded after parsing. `Span<T>`-based parsing (`Slice`/range indexers plus `TryParse` overloads that accept a span) does the same work with zero intermediate allocations.

## Bad

```csharp
public static (int Hour, int Minute) ParseTime(string text) // "14:30"
{
    var parts = text.Split(':'); // allocates a string[] AND two substrings
    return (int.Parse(parts[0]), int.Parse(parts[1]));
}
```

## Good

```csharp
public static (int Hour, int Minute) ParseTime(ReadOnlySpan<char> text) // "14:30"
{
    var colonIndex = text.IndexOf(':');
    var hour = int.Parse(text[..colonIndex]);
    var minute = int.Parse(text[(colonIndex + 1)..]);
    return (hour, minute); // zero string allocations for the intermediate tokens
}

// Called from a string via the implicit ReadOnlySpan<char> conversion
var (hour, minute) = ParseTime("14:30");
```

## Span-Based TryParse Throughout the BCL

```csharp
// Most numeric/date TryParse overloads accept ReadOnlySpan<char> directly -
// no need to materialize a substring first just to call TryParse on it.
ReadOnlySpan<char> line = "2024-06-01,150.75";
var commaIndex = line.IndexOf(',');

if (DateOnly.TryParse(line[..commaIndex], out var date) &&
    decimal.TryParse(line[(commaIndex + 1)..], out var amount))
{
    Use(date, amount);
}
```

## Tokenizing a Whole Line Without Splitting Into an Array

```csharp
public static void ForEachField(ReadOnlySpan<char> csvLine, Action<ReadOnlySpan<char>> onField)
{
    var remaining = csvLine;
    while (!remaining.IsEmpty)
    {
        var commaIndex = remaining.IndexOf(',');
        if (commaIndex < 0)
        {
            onField(remaining);
            break;
        }
        onField(remaining[..commaIndex]);
        remaining = remaining[(commaIndex + 1)..];
    }
}
```

## See Also

- [mem-span-zero-alloc](mem-span-zero-alloc.md) - Span fundamentals
- [mem-ref-struct-stack](mem-ref-struct-stack.md) - Why spans stay stack-only
- [linq-span-linq-alternative](linq-span-linq-alternative.md) - When to reach for spans over LINQ
