# di-constructor-injection

> Prefer constructor injection over service-locator or static access to dependencies

## Why It Matters

Constructor injection makes a type's dependencies explicit and visible in its signature - anyone reading the constructor immediately knows what the class needs to function, and the DI container can validate the entire object graph at startup. Reaching into `IServiceProvider` or a static accessor hides dependencies inside method bodies, making them invisible to both readers and the container.

## Bad

```csharp
public class OrderProcessor
{
    public Task ProcessAsync(Order order)
    {
        // Dependency hidden inside the method - invisible from the class's public surface
        var gateway = ServiceLocator.Current.GetService<IPaymentGateway>();
        return gateway!.ChargeAsync(order.Total);
    }
}
```

## Good

```csharp
public class OrderProcessor(IPaymentGateway gateway)
{
    public Task ProcessAsync(Order order) => gateway.ChargeAsync(order.Total);
    // Every dependency OrderProcessor needs is visible right here, in the constructor
}

// Registration
services.AddScoped<IPaymentGateway, StripeGateway>();
services.AddScoped<OrderProcessor>();
```

## Testability Benefit

```csharp
[Fact]
public async Task ProcessAsync_ChargesGateway()
{
    var gateway = Substitute.For<IPaymentGateway>();
    var processor = new OrderProcessor(gateway); // trivial to construct with a test double

    await processor.ProcessAsync(new Order { Total = 100m });

    await gateway.Received(1).ChargeAsync(100m);
}
```

## See Also

- [di-avoid-service-locator](di-avoid-service-locator.md) - The anti-pattern this rule avoids
- [api-primary-constructor](api-primary-constructor.md) - Primary constructors pair naturally with DI
- [di-register-interfaces](di-register-interfaces.md) - What to actually inject
