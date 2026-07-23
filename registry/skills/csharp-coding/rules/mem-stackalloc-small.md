# mem-stackalloc-small

> Use `stackalloc` for small, bounded-size buffers instead of heap arrays

## Why It Matters

`stackalloc` allocates memory directly on the stack frame, avoiding a heap allocation and GC tracking entirely. It's ideal for small, fixed-upper-bound buffers used and discarded within a single method call (parsing, formatting, hashing). Because it's stack memory, it must never be stored past the method's lifetime and the size must be bounded to avoid stack overflow.

## Bad

```csharp
public static string FormatId(int id)
{
    // Small, short-lived buffer, but heap-allocated
    var buffer = new char[16];
    id.TryFormat(buffer, out var written);
    return new string(buffer, 0, written);
}
```

## Good

```csharp
public static string FormatId(int id)
{
    Span<char> buffer = stackalloc char[16]; // stack-allocated, no GC involvement
    id.TryFormat(buffer, out var written);
    return new string(buffer[..written]);
}

// Combine with a size guard for variable-but-bounded input
public static int HashPath(ReadOnlySpan<char> path)
{
    const int MaxStack = 256;
    Span<char> normalized = path.Length <= MaxStack
        ? stackalloc char[path.Length]
        : new char[path.Length]; // fall back to heap for unexpectedly large input

    path.ToLowerInvariant(normalized);
    return string.GetHashCode(normalized);
}
```

## Safety Rules

```csharp
// 1. Never return a Span<T> that wraps a stackalloc buffer from the method that
//    allocated it - the stack frame is gone once the method returns.
public static Span<char> Bad() // BAD: dangling stack memory
{
    Span<char> buffer = stackalloc char[16];
    return buffer;
}

// 2. Bound the size (compile-time constant or a checked runtime limit) - unbounded
//    or attacker-controlled sizes can overflow the stack.
// 3. stackalloc inside a loop reuses stack space per iteration in C# - still keep
//    sizes small and predictable.
```

## See Also

- [mem-span-zero-alloc](mem-span-zero-alloc.md) - Span basics
- [mem-ref-struct-stack](mem-ref-struct-stack.md) - Why the result can't escape
- [mem-arraypool-rent](mem-arraypool-rent.md) - The heap-allocated alternative for larger buffers
