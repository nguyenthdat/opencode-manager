# anti-singleton-static-state

> Don't hide dependencies behind static singletons or mutable static state

## Why It Matters

A static/singleton accessor (`AppContext.Current`, a static mutable field) is a global variable in disguise - it makes dependencies invisible in constructors, makes parallel test execution unreliable (shared mutable state across tests), and makes swapping an implementation for testing require reaching into static setup/teardown instead of just passing a different value to a constructor.

## Bad

```csharp
public static class CurrentUser
{
    public static User? Value { get; set; } // global mutable state, set from... somewhere
}

public class OrderService
{
    public void PlaceOrder(Order order)
    {
        // Hidden dependency on global state - invisible from OrderService's public surface,
        // and impossible to run two tests with different "current users" in parallel safely.
        order.PlacedBy = CurrentUser.Value!.Id;
    }
}
```

## Good

```csharp
public class OrderService(ICurrentUserAccessor currentUser)
{
    public void PlaceOrder(Order order)
    {
        order.PlacedBy = currentUser.UserId; // explicit dependency, injected per request/scope
    }
}

public interface ICurrentUserAccessor
{
    Guid UserId { get; }
}

// ASP.NET Core: scoped per-request, not a process-wide static
services.AddScoped<ICurrentUserAccessor, HttpContextCurrentUserAccessor>();
```

## Genuinely Stateless Singletons Are Fine

```csharp
// A truly stateless, thread-safe singleton (no mutable state, or immutable
// shared state) is not what this rule targets - see di-lifetime-choice.
services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
```

## See Also

- [di-constructor-injection](di-constructor-injection.md) - The correct default pattern
- [di-avoid-service-locator](di-avoid-service-locator.md) - A related hidden-dependency anti-pattern
