# test-mock-interfaces-not-concretes

> Mock interfaces/abstractions, not concrete classes

## Why It Matters

Mocking libraries can only override `virtual`/interface members - mocking a concrete class either requires every member to be `virtual` (leaking test concerns into production design) or silently fails to intercept non-virtual calls. Depending on interfaces in the first place (see `di-register-interfaces`) means every dependency is naturally mockable without any special-casing.

## Bad

```csharp
public class StripeGateway // concrete class, no interface
{
    public virtual Task<bool> ChargeAsync(decimal amount) => Task.FromResult(true);
    // Every method that might need mocking must be marked virtual - awkward,
    // and easy to forget for a newly added method.
}

public class OrderProcessor(StripeGateway gateway) // depends on the concrete type directly
{
    public Task ProcessAsync(Order order) => gateway.ChargeAsync(order.Total);
}

// Test must instantiate/subclass StripeGateway just to fake its behavior
var mockGateway = Substitute.ForPartsOf<StripeGateway>(); // works, but awkward and fragile
```

## Good

```csharp
public interface IPaymentGateway
{
    Task<bool> ChargeAsync(decimal amount);
}

public class StripeGateway : IPaymentGateway
{
    public Task<bool> ChargeAsync(decimal amount) => Task.FromResult(true); // no virtual needed
}

public class OrderProcessor(IPaymentGateway gateway)
{
    public Task ProcessAsync(Order order) => gateway.ChargeAsync(order.Total);
}

[Fact]
public async Task ProcessAsync_ChargesGateway()
{
    var gateway = Substitute.For<IPaymentGateway>(); // trivial, no partial-mock tricks needed
    gateway.ChargeAsync(100m).Returns(true);

    var processor = new OrderProcessor(gateway);
    await processor.ProcessAsync(new Order { Total = 100m });

    await gateway.Received(1).ChargeAsync(100m);
}
```

## When There's Genuinely No Reasonable Interface

```csharp
// Third-party sealed classes (many BCL/SDK types) can't be mocked directly at all -
// wrap them behind your own interface (an "adapter") instead of trying to mock them.
public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
```

## See Also

- [di-register-interfaces](di-register-interfaces.md) - Depending on interfaces in production code
- [test-nsubstitute-moq](test-nsubstitute-moq.md) - Mocking library usage in depth
- [anti-datetime-now-untestable](anti-datetime-now-untestable.md) - The IClock example applied
