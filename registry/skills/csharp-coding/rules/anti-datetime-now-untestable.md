# anti-datetime-now-untestable

> Don't call `DateTime.Now`/`DateTime.UtcNow` directly in business logic; inject a clock abstraction instead

## Why It Matters

Code that reads the system clock directly can't be deterministically unit tested (you can't set "now" to a fixed value for the test), and can't simulate time-dependent edge cases (midnight rollover, daylight saving transitions, leap years) without waiting for them to actually happen.

## Bad

```csharp
public class SubscriptionService
{
    public bool IsExpired(Subscription subscription) => subscription.ExpiresAt < DateTime.UtcNow;
    // Untestable: the test's result depends on WHEN it happens to run
}
```

## Good

```csharp
public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}

public class SubscriptionService(IClock clock)
{
    public bool IsExpired(Subscription subscription) => subscription.ExpiresAt < clock.UtcNow;
}

[Fact]
public void IsExpired_ReturnsTrue_WhenExpirationIsInThePast()
{
    var fakeClock = Substitute.For<IClock>();
    fakeClock.UtcNow.Returns(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));

    var service = new SubscriptionService(fakeClock);
    var subscription = new Subscription { ExpiresAt = new DateTimeOffset(2025, 12, 31, 0, 0, 0, TimeSpan.Zero) };

    Assert.True(service.IsExpired(subscription)); // deterministic, reproducible regardless of when the test runs
}
```

## .NET 8+: TimeProvider

```csharp
// The BCL now ships a built-in abstraction (TimeProvider) instead of needing
// a custom IClock interface for most cases.
public class SubscriptionService(TimeProvider timeProvider)
{
    public bool IsExpired(Subscription subscription) =>
        subscription.ExpiresAt < timeProvider.GetUtcNow();
}

var fakeTimeProvider = new FakeTimeProvider(); // Microsoft.Extensions.TimeProvider.Testing
fakeTimeProvider.SetUtcNow(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
```

## See Also

- [test-mock-interfaces-not-concretes](test-mock-interfaces-not-concretes.md) - Mocking the clock abstraction
- [lint-banned-api-analyzer](lint-banned-api-analyzer.md) - Banning `DateTime.Now` at compile time
