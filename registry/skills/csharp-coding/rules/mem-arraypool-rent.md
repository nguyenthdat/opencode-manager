# mem-arraypool-rent

> Rent short-lived large buffers from `ArrayPool<T>` instead of allocating new arrays

## Why It Matters

Allocating and discarding large arrays repeatedly (e.g. per-request buffers) pressures the GC and can push allocations onto the Large Object Heap (>= 85,000 bytes), which is only compacted on full GCs. `ArrayPool<T>.Shared` reuses buffers across calls, drastically reducing allocation churn in hot paths like network/serialization code.

## Bad

```csharp
public byte[] ReadChunk(Stream stream, int size)
{
    var buffer = new byte[size]; // new allocation every call
    stream.Read(buffer, 0, size);
    return buffer;
}
```

## Good

```csharp
public int ProcessChunk(Stream stream, int size)
{
    var pool = ArrayPool<byte>.Shared;
    var buffer = pool.Rent(size); // may return a buffer LARGER than requested
    try
    {
        var read = stream.Read(buffer, 0, size);
        return Handle(buffer.AsSpan(0, read));
    }
    finally
    {
        pool.Return(buffer, clearArray: true); // clear if it held sensitive data
    }
}

// Common pattern: pooled buffer wrapped for safe disposal
public readonly struct RentedBuffer : IDisposable
{
    private readonly byte[] _array;
    public Span<byte> Span { get; }

    public RentedBuffer(int minimumSize)
    {
        _array = ArrayPool<byte>.Shared.Rent(minimumSize);
        Span = _array.AsSpan(0, minimumSize);
    }

    public void Dispose() => ArrayPool<byte>.Shared.Return(_array);
}

using var rented = new RentedBuffer(4096);
FillBuffer(rented.Span);
```

## Pitfalls

```csharp
// 1. Rented arrays can be LARGER than requested - never assume buffer.Length == size
var buffer = ArrayPool<byte>.Shared.Rent(100);
// buffer.Length might be 128 - always track the logical length separately

// 2. Always return in a finally block, even on exceptions
// 3. Don't retain a reference to a returned buffer - it may be handed to someone else
// 4. Don't rent for long-lived data - the pool is for short-lived, high-churn buffers
```

## See Also

- [mem-span-zero-alloc](mem-span-zero-alloc.md) - Slicing pooled buffers without copies
- [mem-large-object-heap](mem-large-object-heap.md) - Why large arrays are expensive
- [mem-object-pooling](mem-object-pooling.md) - Pooling arbitrary objects, not just arrays
