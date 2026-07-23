# mem-span-zero-alloc

> Use `Span<T>`/`ReadOnlySpan<T>` for zero-allocation slicing and parsing

## Why It Matters

`Substring`, `Skip`/`Take`, and array slicing all allocate a new copy. `Span<T>` and `ReadOnlySpan<T>` are stack-only views over contiguous memory (arrays, stackalloc buffers, or strings via `AsSpan()`) that let you slice, parse, and iterate without allocating.

## Bad

```csharp
public static (string Key, string Value) SplitHeader(string line)
{
    var idx = line.IndexOf(':');
    var key = line.Substring(0, idx);       // allocates
    var value = line.Substring(idx + 1).Trim(); // allocates twice
    return (key, value);
}
```

## Good

```csharp
public static (string Key, string Value) SplitHeader(ReadOnlySpan<char> line)
{
    var idx = line.IndexOf(':');
    var key = line[..idx];
    var value = line[(idx + 1)..].Trim();
    return (key.ToString(), value.ToString()); // allocate only at the final boundary
}

// Parsing numbers without allocating a substring first
public static bool TryParseVersion(ReadOnlySpan<char> text, out int major, out int minor)
{
    major = minor = 0;
    var dot = text.IndexOf('.');
    if (dot < 0) return false;

    return int.TryParse(text[..dot], out major)
        && int.TryParse(text[(dot + 1)..], out minor);
}

// Slicing an array without copying
public static int Sum(Span<int> values)
{
    var total = 0;
    foreach (var v in values) total += v;
    return total;
}

var buffer = new int[100];
var firstHalf = buffer.AsSpan(0, 50); // view, not a copy
```

## Span Constraints

```csharp
// Span<T> is a ref struct - it can never be:
// - a field of a class (only of another ref struct)
// - boxed, stored in a List<T>, or captured by a lambda/async method
// See mem-ref-struct-stack for the full rules.

public async Task BadAsync(ReadOnlySpan<char> text) // won't compile
{
    await Task.Delay(1);
    Console.WriteLine(text.Length);
}
```

## See Also

- [mem-ref-struct-stack](mem-ref-struct-stack.md) - Why spans can't cross await/heap boundaries
- [mem-memory-async-boundary](mem-memory-async-boundary.md) - The async-friendly alternative
- [perf-span-parsing](perf-span-parsing.md) - Parsing patterns with spans
