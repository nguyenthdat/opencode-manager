# perf-json-source-gen

> Use `System.Text.Json` source generation for serialization on hot paths and in trimmed/AOT-compiled apps

## Why It Matters

Reflection-based JSON serialization inspects type metadata at runtime on every (or first, then cached) serialize/deserialize call, and is fundamentally incompatible with full trimming and NativeAOT (the reflection metadata it needs gets trimmed away). `System.Text.Json`'s source generator produces purpose-built, reflection-free serialization code at compile time - faster, trimmer-safe, and AOT-compatible.

## Bad

```csharp
public string Serialize(Order order) => JsonSerializer.Serialize(order); // reflection-based by default

app.MapPost("/orders", async (HttpContext context) =>
{
    var order = await JsonSerializer.DeserializeAsync<Order>(context.Request.Body); // reflection every call
    // ...
});
```

## Good

```csharp
[JsonSerializable(typeof(Order))]
[JsonSerializable(typeof(OrderDto))]
public partial class AppJsonContext : JsonSerializerContext;

public string Serialize(Order order) =>
    JsonSerializer.Serialize(order, AppJsonContext.Default.Order); // no reflection, compile-time generated

app.MapPost("/orders", async (HttpContext context) =>
{
    var order = await JsonSerializer.DeserializeAsync(
        context.Request.Body, AppJsonContext.Default.Order);
    // ...
});
```

## Wiring It Into ASP.NET Core's Minimal APIs

```csharp
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonContext.Default);
});
```

## Combining Multiple Contexts

```csharp
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
[JsonSerializable(typeof(Order))]
[JsonSerializable(typeof(List<Order>))] // collections need their own entry too
public partial class AppJsonContext : JsonSerializerContext;
```

## Required for NativeAOT Publishing

```xml
<!-- .csproj -->
<PropertyGroup>
  <PublishAot>true</PublishAot>
  <!-- Reflection-based JsonSerializer.Serialize<T>() calls will warn (IL2026/IL3050)
       or fail at runtime under AOT without a matching JsonSerializerContext. -->
</PropertyGroup>
```

## See Also

- [perf-source-generators-over-reflection](perf-source-generators-over-reflection.md) - The general source-generator pattern
- [mem-large-object-heap](mem-large-object-heap.md) - Related allocation concerns for large serialized payloads
