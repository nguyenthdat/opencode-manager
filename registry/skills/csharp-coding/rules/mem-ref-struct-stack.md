# mem-ref-struct-stack

> Use `ref struct` to define stack-only types that must never escape to the heap

## Why It Matters

`ref struct` types (like `Span<T>`) are guaranteed by the compiler to live only on the stack: they can't be boxed, can't be a field of a non-`ref struct`, can't be captured by lambdas/async state machines, and can't implement interfaces (pre-C# 13) or be used as generic type arguments. This lets them safely wrap raw pointers/stack memory with zero risk of dangling references living past their backing memory's lifetime.

## Bad

```csharp
public class Buffer
{
    // Won't compile: a ref struct cannot be a field of a regular class
    private Span<byte> _data;
}

public async Task ProcessAsync(Span<byte> data) // won't compile - ref struct across await
{
    await Task.Delay(1);
    Use(data);
}
```

## Good

```csharp
// Define your own ref struct for a stack-only parser/cursor
public ref struct TokenReader
{
    private ReadOnlySpan<char> _remaining;

    public TokenReader(ReadOnlySpan<char> text) => _remaining = text;

    public bool TryReadToken(out ReadOnlySpan<char> token)
    {
        var idx = _remaining.IndexOf(' ');
        if (idx < 0)
        {
            token = _remaining;
            _remaining = default;
            return !token.IsEmpty;
        }

        token = _remaining[..idx];
        _remaining = _remaining[(idx + 1)..];
        return true;
    }
}

// Usage stays entirely synchronous and stack-scoped
public static int CountTokens(ReadOnlySpan<char> text)
{
    var reader = new TokenReader(text);
    var count = 0;
    while (reader.TryReadToken(out _)) count++;
    return count;
}
```

## When It Doesn't Fit

```csharp
// Need to store the data for later, or use it after an await? Use Memory<T> instead,
// which is not a ref struct. See mem-memory-async-boundary.

// Need heap-friendly value semantics with structure? Use a readonly struct/record struct
// that copies plain value fields, not a ref struct wrapping a span.
```

## See Also

- [mem-span-zero-alloc](mem-span-zero-alloc.md) - Span/ReadOnlySpan basics
- [mem-memory-async-boundary](mem-memory-async-boundary.md) - The heap-friendly alternative
- [mem-stackalloc-small](mem-stackalloc-small.md) - Pairing ref struct with stackalloc
