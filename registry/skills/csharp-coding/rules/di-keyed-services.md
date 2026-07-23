# di-keyed-services

> Use keyed DI services (.NET 8+) for multiple implementations of one interface, instead of custom factory wrappers

## Why It Matters

Before keyed services, resolving "the right implementation among several" required a hand-rolled factory, an enum-switch resolver, or registering each variant under a distinctly-named wrapper interface. `AddKeyed*` and `[FromKeyedServices]` let the container itself associate multiple implementations of the same interface with distinct keys, resolved directly through standard constructor injection.

## Bad

```csharp
services.AddScoped<StripeGateway>();
services.AddScoped<AdyenGateway>();

// Hand-rolled resolution logic just to pick the right one
public class PaymentGatewayFactory(IServiceProvider services)
{
    public IPaymentGateway Create(string provider) => provider switch
    {
        "stripe" => services.GetRequiredService<StripeGateway>(),
        "adyen" => services.GetRequiredService<AdyenGateway>(),
        _ => throw new ArgumentException($"Unknown provider: {provider}")
    };
}
```

## Good

```csharp
services.AddKeyedScoped<IPaymentGateway, StripeGateway>("stripe");
services.AddKeyedScoped<IPaymentGateway, AdyenGateway>("adyen");

public class OrderProcessor([FromKeyedServices("stripe")] IPaymentGateway gateway)
{
    public Task ProcessAsync(Order order) => gateway.ChargeAsync(order.Total);
}

// Or resolve dynamically when the key is only known at runtime
public class DynamicOrderProcessor(IServiceProvider services)
{
    public Task ProcessAsync(Order order, string provider)
    {
        var gateway = services.GetRequiredKeyedService<IPaymentGateway>(provider);
        return gateway.ChargeAsync(order.Total);
    }
}
```

## Keys Can Be Any Object, Not Just Strings

```csharp
public enum PaymentProvider { Stripe, Adyen }

services.AddKeyedScoped<IPaymentGateway, StripeGateway>(PaymentProvider.Stripe);
services.AddKeyedScoped<IPaymentGateway, AdyenGateway>(PaymentProvider.Adyen);
```

## See Also

- [di-register-interfaces](di-register-interfaces.md) - Registering interfaces generally
- [di-avoid-service-locator](di-avoid-service-locator.md) - Why the dynamic-resolution form should stay the exception, not the rule
