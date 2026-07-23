# di-lifetime-choice

> Choose `Singleton`/`Scoped`/`Transient` service lifetimes deliberately based on state and thread-safety

## Why It Matters

Registering a service with the wrong lifetime causes real bugs: a `Scoped` `DbContext` accidentally registered `Singleton` gets shared and corrupted across concurrent requests; a stateful, non-thread-safe service registered `Singleton` gets torn by concurrent access; an expensive-to-create service registered `Transient` gets rebuilt needlessly on every injection.

## Bad

```csharp
// DbContext is inherently NOT thread-safe and tracks per-request state -
// registering it Singleton causes cross-request data corruption under load.
services.AddSingleton<AppDbContext>();

// A stateless, cheap-to-construct service registered Transient recreates itself
// on every single injection for no benefit.
services.AddTransient<IDateTimeProvider, SystemDateTimeProvider>();
```

## Good

```csharp
services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString)); // Scoped by default

services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>(); // stateless, safe to share

services.AddScoped<IOrderProcessor, OrderProcessor>(); // per-request state, needs isolation across requests
```

## Lifetime Decision Guide

```text
Singleton  - stateless, or internally thread-safe shared state (caches, clients configured once);
             created once for the app's lifetime.
Scoped     - one instance per request/logical operation (ASP.NET Core: per HTTP request);
             the default for anything touching a DbContext or per-request state.
Transient  - a new instance every time it's requested; use for lightweight, stateless,
             cheap-to-construct services where sharing isn't meaningful or safe.
```

## Watch Constructor Injection of Mismatched Lifetimes

```csharp
// A Singleton CANNOT safely depend on a Scoped service directly - see
// di-avoid-captive-dependency for what goes wrong and how to fix it.
services.AddSingleton<INotificationService, NotificationService>(); // Singleton
services.AddScoped<AppDbContext>(); // Scoped
// NotificationService(AppDbContext dbContext) - captive dependency bug waiting to happen
```

## See Also

- [di-avoid-captive-dependency](di-avoid-captive-dependency.md) - The specific bug from mismatched lifetimes
- [di-validate-on-start](di-validate-on-start.md) - Catching lifetime/registration mistakes at startup
