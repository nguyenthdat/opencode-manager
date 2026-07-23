# di-avoid-service-locator

> Avoid the service-locator anti-pattern - don't sprinkle `IServiceProvider.GetService<T>()` calls through business logic

## Why It Matters

Passing `IServiceProvider` itself into a class (instead of the specific dependencies it needs) hides the real dependency list, defers failures from "container validation at startup" to "random `GetService` call at runtime", and makes unit testing require standing up a full DI container instead of just passing test doubles to a constructor.

## Bad

```csharp
public class OrderProcessor(IServiceProvider services)
{
    public async Task ProcessAsync(Order order)
    {
        // What does OrderProcessor actually need? Impossible to tell from the constructor.
        var gateway = services.GetRequiredService<IPaymentGateway>();
        var logger = services.GetRequiredService<ILogger<OrderProcessor>>();

        await gateway.ChargeAsync(order.Total);
        logger.LogInformation("Processed order {Id}", order.Id);
    }
}
```

## Good

```csharp
public class OrderProcessor(IPaymentGateway gateway, ILogger<OrderProcessor> logger)
{
    public async Task ProcessAsync(Order order)
    {
        await gateway.ChargeAsync(order.Total);
        logger.LogInformation("Processed order {Id}", order.Id);
    }
}
```

## The One Legitimate Use: Factories/Dynamic Resolution

```csharp
// A genuine factory that needs to resolve a variable NUMBER or TYPE of services
// at runtime (unknown at compile time) is a real, narrow exception - just keep
// it isolated to factory/infrastructure code, not sprinkled through business logic.
public class HandlerFactory(IServiceProvider services)
{
    public IEventHandler ResolveHandler(Type eventType) =>
        (IEventHandler)services.GetRequiredService(typeof(IEventHandler<>).MakeGenericType(eventType));
}
```

## See Also

- [di-constructor-injection](di-constructor-injection.md) - The correct default pattern
- [di-keyed-services](di-keyed-services.md) - A compile-time-safer way to pick among implementations
