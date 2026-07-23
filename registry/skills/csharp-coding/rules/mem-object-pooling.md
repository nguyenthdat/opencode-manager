# mem-object-pooling

> Pool expensive-to-create objects with `ObjectPool<T>` instead of reallocating them per use

## Why It Matters

Some objects are expensive to allocate or initialize (large buffers, `StringBuilder` instances, regex matchers, HTTP message contexts). Reconstructing them on every request adds allocation and initialization overhead. `Microsoft.Extensions.ObjectPool` provides a thread-safe pool with pluggable reset-on-return policies, used internally by ASP.NET Core for things like `StringBuilder` and JSON buffers.

## Bad

```csharp
public string BuildLine(IEnumerable<string> parts)
{
    var sb = new StringBuilder(); // new allocation every call, plus internal buffer growth
    foreach (var p in parts) sb.Append(p).Append(',');
    return sb.ToString();
}
```

## Good

```csharp
public sealed class LineBuilder
{
    private static readonly ObjectPool<StringBuilder> Pool =
        new DefaultObjectPoolProvider().CreateStringBuilderPool();

    public string BuildLine(IEnumerable<string> parts)
    {
        var sb = Pool.Get();
        try
        {
            foreach (var p in parts) sb.Append(p).Append(',');
            return sb.ToString();
        }
        finally
        {
            Pool.Return(sb); // policy clears the builder before reuse
        }
    }
}

// Custom pooled policy for a domain object
public sealed class ParseContextPolicy : PooledObjectPolicy<ParseContext>
{
    public override ParseContext Create() => new();

    public override bool Return(ParseContext obj)
    {
        obj.Reset();
        return true; // false would discard the instance instead of pooling it
    }
}

var pool = new DefaultObjectPoolProvider().Create(new ParseContextPolicy());
```

## When Pooling Helps

```text
- Object construction/initialization is measurably expensive (profiled, not assumed)
- Usage is short-lived and strictly scoped (rent, use, return - like a using block)
- High call frequency (per-request, per-message) where allocation churn shows up in GC metrics

Don't pool small, cheap-to-construct objects "for safety" - the pool's own
synchronization and indirection can cost more than the allocation it avoids.
```

## See Also

- [mem-arraypool-rent](mem-arraypool-rent.md) - Pooling for raw buffers specifically
- [perf-stringbuilder-concat](perf-stringbuilder-concat.md) - StringBuilder usage patterns
- [mem-large-object-heap](mem-large-object-heap.md) - Related GC-pressure concerns for large buffers
