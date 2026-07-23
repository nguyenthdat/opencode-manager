# doc-example-code

> Include `<example>`/`<code>` blocks in documentation for non-obvious or commonly-misused APIs

## Why It Matters

A `<summary>` describes what a method does; an `<example>` shows *how* to actually call it correctly, which is often faster for a consumer to absorb than prose - especially for APIs with several steps, unusual parameter shapes, or configuration objects.

## Bad

```csharp
/// <summary>Builds an HTTP request with retry and timeout policies.</summary>
public HttpRequestConfigBuilder CreateBuilder() => new();
// Consumer has to guess the fluent call chain from IntelliSense alone
```

## Good

```csharp
/// <summary>Builds an HTTP request with retry and timeout policies.</summary>
/// <example>
/// <code>
/// var config = CreateBuilder()
///     .WithUrl("https://api.example.com")
///     .WithTimeout(TimeSpan.FromSeconds(10))
///     .WithRetries(3)
///     .Build();
/// </code>
/// </example>
public HttpRequestConfigBuilder CreateBuilder() => new();
```

## Documenting Common Pitfalls Alongside the Example

```csharp
/// <summary>
/// Rents a buffer from the shared array pool. The caller MUST return it via
/// <see cref="ArrayPool{T}.Return"/> in a <c>finally</c> block.
/// </summary>
/// <example>
/// <code>
/// var buffer = ArrayPool&lt;byte&gt;.Shared.Rent(1024);
/// try
/// {
///     Fill(buffer);
/// }
/// finally
/// {
///     ArrayPool&lt;byte&gt;.Shared.Return(buffer);
/// }
/// </code>
/// </example>
public byte[] RentBuffer(int size) => ArrayPool<byte>.Shared.Rent(size);
```

## Keep Examples Compiling by Testing Them

```text
An example that no longer compiles after a refactor is worse than no example -
it actively misleads. Where practical, extract the example into an actual
test/sample project that's compiled and run in CI, and reference or mirror
that code in the doc comment, rather than maintaining two independent copies.
```

## See Also

- [doc-xml-summary-public](doc-xml-summary-public.md) - The base documentation pattern
- [api-builder-fluent](api-builder-fluent.md) - The builder pattern used in this example
