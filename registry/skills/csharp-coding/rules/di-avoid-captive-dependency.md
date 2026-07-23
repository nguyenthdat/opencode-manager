# di-avoid-captive-dependency

> Avoid captive dependencies: a longer-lived service (Singleton) holding a reference to a shorter-lived one (Scoped/Transient)

## Why It Matters

When a `Singleton` captures a `Scoped` dependency in its constructor, the DI container resolves that scoped instance exactly once (at the singleton's creation) and the singleton holds onto it forever - the "scoped" service is effectively promoted to singleton lifetime, but silently and incorrectly. For a `DbContext` this means every request after the first shares one stale, eventually-disposed context.

## Bad

```csharp
services.AddSingleton<INotificationService, NotificationService>();
services.AddScoped<AppDbContext>();

public class NotificationService(AppDbContext dbContext) : INotificationService
{
    // dbContext is captured ONCE, at application startup, and reused for the
    // entire app lifetime - even though AppDbContext was registered Scoped.
    public Task NotifyAsync(string message) => dbContext.Notifications.AddAsync(new(message)).AsTask();
}
// By the time a second request comes in, dbContext may already be disposed,
// or requests start silently sharing (and corrupting) the same context instance.
```

## Good

```csharp
services.AddSingleton<INotificationService, NotificationService>();
services.AddScoped<AppDbContext>();

public class NotificationService(IServiceScopeFactory scopeFactory) : INotificationService
{
    public async Task NotifyAsync(string message)
    {
        await using var scope = scopeFactory.CreateAsyncScope(); // a fresh scope per call
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Notifications.AddAsync(new(message));
        await dbContext.SaveChangesAsync();
    }
}
```

## Or, Simplest: Match the Lifetimes

```csharp
// If NotificationService genuinely needs per-request DbContext access and is
// only ever used within a request, just register it Scoped too - no captive
// dependency, no manual scope management needed.
services.AddScoped<INotificationService, NotificationService>();
services.AddScoped<AppDbContext>();
```

## Catching This Automatically

```csharp
// ASP.NET Core validates scopes by default in Development, and you can force
// it everywhere (including Production) via ValidateScopes/ValidateOnBuild:
var host = Host.CreateDefaultBuilder(args)
    .UseDefaultServiceProvider(options =>
    {
        options.ValidateScopes = true;
        options.ValidateOnBuild = true;
    })
    .Build();
```

## See Also

- [di-lifetime-choice](di-lifetime-choice.md) - Choosing lifetimes correctly in the first place
- [di-validate-on-start](di-validate-on-start.md) - Catching DI graph mistakes at startup
