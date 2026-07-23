# di-register-interfaces

> Register and depend on interfaces in the DI container, not concrete implementation types

## Why It Matters

Depending on a concrete class ties every consumer to exactly one implementation and makes swapping it (for a mock in tests, or a different provider in production) require changing every constructor signature that used it. Registering and injecting the interface keeps the implementation an internal detail of the composition root.

## Bad

```csharp
public class OrderProcessor(StripeGateway gateway) // depends on the CONCRETE class directly
{
    public Task ProcessAsync(Order order) => gateway.ChargeAsync(order.Total);
}

services.AddScoped<StripeGateway>();
services.AddScoped<OrderProcessor>();

// Switching payment providers means changing OrderProcessor's constructor signature,
// and tests must construct a real (or subclassed) StripeGateway.
```

## Good

```csharp
public interface IPaymentGateway
{
    Task<bool> ChargeAsync(decimal amount);
}

public class StripeGateway : IPaymentGateway { /* ... */ }

public class OrderProcessor(IPaymentGateway gateway)
{
    public Task ProcessAsync(Order order) => gateway.ChargeAsync(order.Total);
}

services.AddScoped<IPaymentGateway, StripeGateway>();
services.AddScoped<OrderProcessor>();

// Swapping providers: change ONE registration line, zero changes to OrderProcessor
services.AddScoped<IPaymentGateway, AdyenGateway>();
```

## Exceptions: Concrete Types With No Meaningful Abstraction

```csharp
// Some types have no useful abstraction to introduce - registering the
// concrete type directly is fine and common for these (DbContext, HttpClient
// via IHttpClientFactory, MediatR's IMediator implementation, etc.)
services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
```

## See Also

- [di-constructor-injection](di-constructor-injection.md) - Constructor injection fundamentals
- [api-interface-segregation](api-interface-segregation.md) - Designing the interfaces you register
- [test-mock-interfaces-not-concretes](test-mock-interfaces-not-concretes.md) - Why this matters for testability
