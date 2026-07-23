# api-sealed-by-default

> Seal classes by default; remove `sealed` (and design for it) only when inheritance is an intentional extension point

## Why It Matters

An unsealed class is an implicit promise that subclassing is supported and will remain compatible across future changes - the Framework Design Guidelines call this out explicitly. Most classes are never meant to be inherited from; sealing them prevents fragile-base-class problems, lets the JIT devirtualize calls for a small performance win, and forces a deliberate decision when extension really is needed.

## Bad

```csharp
public class OrderValidator // implicitly open for inheritance, never actually designed for it
{
    public virtual bool IsValid(Order order) => order.Total > 0;
}

// Some other team quietly subclasses it, coupling to internal behavior:
public class CustomOrderValidator : OrderValidator
{
    public override bool IsValid(Order order) => base.IsValid(order) && order.Lines.Any();
}
// Now every change to OrderValidator risks breaking CustomOrderValidator.
```

## Good

```csharp
public sealed class OrderValidator
{
    public bool IsValid(Order order) => order.Total > 0 && order.Lines.Count > 0;
}

// Need variation? Depend on an abstraction instead of inheritance.
public interface IOrderValidator
{
    bool IsValid(Order order);
}

public sealed class StandardOrderValidator : IOrderValidator
{
    public bool IsValid(Order order) => order.Total > 0;
}

public sealed class StrictOrderValidator : IOrderValidator
{
    public bool IsValid(Order order) => order.Total > 0 && order.Lines.Count > 0;
}
```

## When to Leave a Class Open

```csharp
// Deliberately designed as a base class, with a documented extension contract
public abstract class HttpMessageHandlerBase : DelegatingHandler
{
    protected abstract Task<HttpResponseMessage> SendCoreAsync(
        HttpRequestMessage request, CancellationToken cancellationToken);

    // Documented, tested extension points - this IS an intentional inheritance API
}
```

## See Also

- [api-interface-segregation](api-interface-segregation.md) - Preferring composition over inheritance
- [api-extension-methods](api-extension-methods.md) - Extending behavior without subclassing
- [anti-god-class](anti-god-class.md) - Related class-design smell
