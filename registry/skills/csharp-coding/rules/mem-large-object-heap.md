# mem-large-object-heap

> Be aware that objects/arrays >= 85,000 bytes land on the Large Object Heap and are compacted only during full (gen2) GCs

## Why It Matters

The Large Object Heap (LOH) is not compacted by default on every collection, so repeated large allocations can fragment it, increasing working set even when logically "freed" memory exists. Large, short-lived allocations (big arrays, big strings, big `List<T>` backing arrays) are a common source of unexpected memory growth and GC pauses in long-running services.

## Bad

```csharp
public byte[] Serialize(Report report)
{
    // Frequently allocates just over the 85,000 byte LOH threshold
    var buffer = new byte[100_000];
    var written = WriteReport(report, buffer);
    return buffer[..written]; // another allocation, possibly LOH-sized too
}
```

## Good

```csharp
// Reuse a pooled buffer instead of allocating a new LOH object each call
public int Serialize(Report report, Span<byte> destination) => WriteReport(report, destination);

public byte[] SerializeWithPool(Report report)
{
    var pool = ArrayPool<byte>.Shared;
    var buffer = pool.Rent(100_000); // pool tracks/reuses LOH-sized buffers
    try
    {
        var written = WriteReport(report, buffer);
        return buffer.AsSpan(0, written).ToArray(); // one small, sized allocation
    }
    finally
    {
        pool.Return(buffer);
    }
}
```

## Mitigations

```text
- Pool large, frequently-allocated buffers (see mem-arraypool-rent)
- Stream data instead of buffering it all in memory when possible
- If LOH fragmentation is a proven problem, opt into LOH compaction for one collection:
    GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce;
    GC.Collect();
  Use sparingly - this is a targeted, occasional fix, not a routine call.
- Measure with dotnet-counters / dotnet-gcdump before treating this as a real problem
```

## See Also

- [mem-arraypool-rent](mem-arraypool-rent.md) - Pooling large buffers to avoid repeated LOH allocations
- [mem-object-pooling](mem-object-pooling.md) - General object pooling
- [perf-avoid-linq-hot-path](perf-avoid-linq-hot-path.md) - Reducing allocations in hot paths
