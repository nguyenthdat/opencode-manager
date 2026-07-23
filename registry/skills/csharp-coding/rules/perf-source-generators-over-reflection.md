# perf-source-generators-over-reflection

> Prefer source generators over runtime reflection for repetitive, pattern-based code generation

## Why It Matters

Reflection-based approaches (building serializers, mappers, or DI wiring by inspecting types at runtime via `GetProperties()`/`Activator.CreateInstance`) pay a real, repeated runtime cost and cannot be trimmed/AOT-compiled safely. Source generators (`System.Text.Json`'s, `[LoggerMessage]`, regex generators, custom Roslyn generators) do the equivalent work at compile time, producing plain, fast, trimming/NativeAOT-friendly code with zero runtime reflection cost.

## Bad

```csharp
public static class Mapper
{
    public static TDestination Map<TSource, TDestination>(TSource source) where TDestination : new()
    {
        var destination = new TDestination();
        foreach (var sourceProp in typeof(TSource).GetProperties())
        {
            var destProp = typeof(TDestination).GetProperty(sourceProp.Name);
            destProp?.SetValue(destination, sourceProp.GetValue(source)); // reflection on every call
        }
        return destination;
    }
}
```

## Good

```csharp
// A source generator (e.g. Mapperly) generates a plain, direct mapping method
// at compile time - no reflection at runtime, fully trim/AOT-compatible, and
// visible/debuggable as ordinary generated C# source.
[Mapper]
public partial class OrderMapper
{
    public partial OrderDto ToDto(Order order);
}

// Generated (conceptually) as:
// public partial OrderDto ToDto(Order order) => new OrderDto { Id = order.Id, Total = order.Total };
```

## System.Text.Json Source Generation

```csharp
[JsonSerializable(typeof(Order))]
public partial class AppJsonContext : JsonSerializerContext;

var json = JsonSerializer.Serialize(order, AppJsonContext.Default.Order); // no reflection at runtime
```

## [LoggerMessage] for Zero-Allocation, Compile-Time-Generated Logging

```csharp
public partial class OrderProcessor
{
    [LoggerMessage(Level = LogLevel.Information, Message = "Processed order {OrderId}")]
    public partial void LogOrderProcessed(int orderId);
}
```

## When Reflection Is Still the Right Tool

```text
Rarely-called, cold-path code (application startup, one-time configuration
scanning) where the reflection cost is amortized over the app's lifetime, and
where AOT/trimming compatibility isn't a concern, can still reasonably use
reflection - the concern is specifically PER-CALL, HOT-PATH reflection.
```

## See Also

- [perf-json-source-gen](perf-json-source-gen.md) - JSON-specific deep dive
- [mem-avoid-boxing](mem-avoid-boxing.md) - Another reflection-adjacent allocation concern
