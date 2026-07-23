# mem-memory-async-boundary

> Use `Memory<T>`/`ReadOnlyMemory<T>` (not `Span<T>`) when data must cross an `await` or be stored on the heap

## Why It Matters

`Span<T>` is a `ref struct` and cannot be a field, cannot be captured by an async state machine, and cannot survive across an `await`. `Memory<T>` is a regular (non-ref) struct that wraps the same kind of contiguous memory but can be stored, passed to async methods, and later converted back to a `Span<T>` with `.Span` for the actual synchronous access.

## Bad

```csharp
// Won't compile: Span<T> cannot be a parameter of an async method
public async Task WriteAsync(Span<byte> data)
{
    await _stream.WriteAsync(data); // CS4012
}
```

## Good

```csharp
public async Task WriteAsync(ReadOnlyMemory<byte> data)
{
    await _stream.WriteAsync(data); // Stream.WriteAsync accepts ReadOnlyMemory<byte>
}

public sealed class BufferedWriter
{
    private Memory<byte> _pending; // fine as a field - Memory<T> is not a ref struct

    public void SetBuffer(Memory<byte> buffer) => _pending = buffer;

    public void ProcessSynchronously()
    {
        Span<byte> span = _pending.Span; // convert back to Span only for sync use
        span.Fill(0);
    }
}

// Slicing Memory<T> is allocation-free, same as Span<T>
public async Task WriteInChunksAsync(ReadOnlyMemory<byte> data, int chunkSize)
{
    for (var offset = 0; offset < data.Length; offset += chunkSize)
    {
        var length = Math.Min(chunkSize, data.Length - offset);
        await _stream.WriteAsync(data.Slice(offset, length));
    }
}
```

## Rule of Thumb

```csharp
// Synchronous, hot, stack-only code           -> Span<T> / ReadOnlySpan<T>
// Async methods, fields, captured by closures  -> Memory<T> / ReadOnlyMemory<T>

public ReadOnlyMemory<char> Name { get; }           // ok as a property/field
// public ReadOnlySpan<char> Name { get; }          // would not compile as an auto-property backing field
```

## See Also

- [mem-span-zero-alloc](mem-span-zero-alloc.md) - Span for synchronous zero-allocation code
- [mem-ref-struct-stack](mem-ref-struct-stack.md) - Ref struct constraints explained
- [async-cancellationtoken-propagate](async-cancellationtoken-propagate.md) - Async method signatures
