# di-options-pattern

> Use the Options pattern (`IOptions<T>`/`IOptionsSnapshot<T>`/`IOptionsMonitor<T>`) for configuration instead of reading `IConfiguration` directly

## Why It Matters

Reading raw string keys from `IConfiguration` scattered through the codebase (`config["Smtp:Host"]`) has no compile-time safety, no central validation, and no easy way to reload settings. The Options pattern binds configuration to a strongly-typed class once, validates it centrally, and gives you the right reload/lifetime semantics for how the settings are actually consumed.

## Bad

```csharp
public class EmailSender(IConfiguration configuration)
{
    public void Send(Email email)
    {
        var host = configuration["Smtp:Host"]; // magic string key, no type safety
        var port = int.Parse(configuration["Smtp:Port"]!); // manual parsing, can throw
        // ...
    }
}
```

## Good

```csharp
public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    public required string Host { get; init; }
    public int Port { get; init; } = 587;
}

// Program.cs
builder.Services
    .AddOptions<SmtpOptions>()
    .Bind(builder.Configuration.GetSection(SmtpOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

public class EmailSender(IOptions<SmtpOptions> options)
{
    private readonly SmtpOptions _options = options.Value;

    public void Send(Email email)
    {
        // _options.Host, _options.Port - strongly typed, validated at startup
    }
}
```

## IOptions vs IOptionsSnapshot vs IOptionsMonitor

```text
IOptions<T>         - Singleton-friendly, resolved once, does NOT reflect config
                      changes made after startup (config reload).
IOptionsSnapshot<T> - Scoped; recomputed once per request/scope; reflects reload
                      changes between requests, not within one.
IOptionsMonitor<T>  - Singleton-friendly; supports live change notifications via
                      OnChange callbacks for genuinely dynamic reconfiguration.
```

## Validating With Data Annotations

```csharp
public sealed class SmtpOptions
{
    [Required]
    public required string Host { get; init; }

    [Range(1, 65535)]
    public int Port { get; init; } = 587;
}
```

## See Also

- [di-validate-on-start](di-validate-on-start.md) - Enforcing this validation fails fast at startup
- [api-required-members](api-required-members.md) - Enforcing mandatory options at the type level
