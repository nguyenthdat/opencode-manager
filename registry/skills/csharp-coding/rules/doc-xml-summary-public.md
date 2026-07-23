# doc-xml-summary-public

> Document all public members with `<summary>` XML doc comments

## Why It Matters

`<summary>` comments power IntelliSense tooltips, generated API documentation (DocFX, Sandcastle), and NuGet package documentation - the primary way most consumers of your library will ever learn what a type or method does, without leaving their editor. Undocumented public APIs force every consumer to read the implementation just to understand the contract.

## Bad

```csharp
public class OrderProcessor
{
    public Task<bool> ProcessAsync(Order order, CancellationToken cancellationToken)
    {
        // no documentation - consumers see only the signature in IntelliSense
        // ...
        return Task.FromResult(true);
    }
}
```

## Good

```csharp
/// <summary>
/// Validates and submits an order for payment processing.
/// </summary>
/// <param name="order">The order to process. Must have at least one line item.</param>
/// <param name="cancellationToken">A token to cancel the operation.</param>
/// <returns><see langword="true"/> if the payment was approved; otherwise, <see langword="false"/>.</returns>
public Task<bool> ProcessAsync(Order order, CancellationToken cancellationToken)
{
    // ...
    return Task.FromResult(true);
}
```

## Class and Interface Summaries

```csharp
/// <summary>
/// Processes customer orders end-to-end: validation, payment, and fulfillment scheduling.
/// </summary>
public class OrderProcessor
{
    // ...
}
```

## Enforcing This With the Compiler

```xml
<!-- .csproj -->
<PropertyGroup>
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <NoWarn>$(NoWarn);CS1591</NoWarn> <!-- remove this line to WARN on any undocumented public member -->
</PropertyGroup>
```

## What Doesn't Need Documentation

```text
Private/internal members, obvious property getters/setters with self-evident
names, and test methods are conventionally exempt - focus documentation effort
on the PUBLIC API surface consumers actually interact with.
```

## See Also

- [doc-param-returns-tags](doc-param-returns-tags.md) - Parameter/return documentation in depth
- [doc-generate-xml-docfile](doc-generate-xml-docfile.md) - Enforcing documentation via the compiler
