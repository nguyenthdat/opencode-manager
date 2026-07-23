# di-avoid-property-injection

> Avoid property/method injection except for genuinely optional dependencies in frameworks that require it

## Why It Matters

Property injection makes a dependency easy to forget to set (the object is fully constructible without it) and hides the requirement from the constructor's signature - exactly the visibility problem constructor injection is meant to solve. It should be reserved for the narrow cases where the hosting framework mandates it (e.g. some UI framework base classes, certain legacy plugin models) or the dependency is genuinely optional.

## Bad

```csharp
public class OrderProcessor
{
    public IPaymentGateway Gateway { get; set; } = null!; // easy to forget to set - null!  lies to the compiler

    public Task ProcessAsync(Order order) => Gateway.ChargeAsync(order.Total);
    // Compiles and constructs fine even if Gateway is never assigned - NullReferenceException at first use
}

var processor = new OrderProcessor(); // "successfully" constructed, but unusable
await processor.ProcessAsync(order);  // boom
```

## Good

```csharp
public class OrderProcessor(IPaymentGateway gateway)
{
    public Task ProcessAsync(Order order) => gateway.ChargeAsync(order.Total);
    // Impossible to construct OrderProcessor without providing a gateway
}
```

## When Property Injection Is Legitimate

```csharp
// A genuinely OPTIONAL dependency, with a safe default, where the class is
// fully functional without it - not a way to sneak past required-dependency discipline.
public class OrderProcessor(IPaymentGateway gateway)
{
    public ILogger Logger { get; set; } = NullLogger.Instance; // safe default; logging is optional

    public Task ProcessAsync(Order order)
    {
        Logger.LogInformation("Processing order {Id}", order.Id);
        return gateway.ChargeAsync(order.Total);
    }
}

// Some UI frameworks (e.g. certain WPF/MAUI base classes, or legacy plugin
// hosts) only support property/method injection due to how they instantiate
// types - accept property injection there as an unavoidable framework constraint.
```

## See Also

- [di-constructor-injection](di-constructor-injection.md) - The preferred default
- [type-null-forgiving-sparingly](type-null-forgiving-sparingly.md) - The `null!` escape hatch this pattern tends to abuse
