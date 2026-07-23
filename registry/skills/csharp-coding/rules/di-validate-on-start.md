# di-validate-on-start

> Validate the DI container's object graph and options eagerly at startup with `ValidateOnBuild`/`ValidateOnStart`

## Why It Matters

By default, .NET's DI container resolves lazily - a missing registration or a captive-dependency mistake only surfaces the first time that specific service is actually requested, which might be hours after deployment, on a rarely-hit code path. Validating eagerly turns these into immediate, obvious startup failures instead of intermittent production incidents.

## Bad

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IOrderProcessor, OrderProcessor>();
// Forgot to register IPaymentGateway - nothing fails until ProcessAsync is
// actually called, possibly in production, possibly days after deployment.
var app = builder.Build();
app.Run();
```

## Good

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IOrderProcessor, OrderProcessor>();

builder.Host.UseDefaultServiceProvider((context, options) =>
{
    options.ValidateScopes = true;   // catches captive-dependency mistakes
    options.ValidateOnBuild = true;  // resolves every registered service once, at Build() time
});

var app = builder.Build(); // throws immediately here if IPaymentGateway is missing
app.Run();
```

## Validating Options at Startup Too

```csharp
builder.Services
    .AddOptions<SmtpOptions>()
    .Bind(builder.Configuration.GetSection("Smtp"))
    .ValidateDataAnnotations()
    .ValidateOnStart(); // fails at startup (not first use) if SmtpOptions is misconfigured

// Requires calling this once, to actually trigger ValidateOnStart's checks:
builder.Services.AddHostedService<OptionsValidationStartupCheck>();
```

## Fail Fast, Not Fail Later

```text
The whole point of this rule: a broken configuration or DI graph should prevent
the application from starting at all (visible immediately in CI/CD, health
checks, or a crash-looping pod) rather than surfacing as an intermittent
500 error days later when a rarely-used code path finally executes.
```

## See Also

- [di-avoid-captive-dependency](di-avoid-captive-dependency.md) - The specific bug ValidateScopes catches
- [di-options-pattern](di-options-pattern.md) - Options configuration this validates
