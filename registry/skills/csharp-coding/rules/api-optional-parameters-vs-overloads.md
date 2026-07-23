# api-optional-parameters-vs-overloads

> Prefer method overloads or named arguments over long lists of optional parameters

## Why It Matters

Optional parameters are baked into the caller's compiled IL at the call site - changing a default value doesn't take effect for already-compiled callers until they recompile, which is a subtle versioning hazard for public libraries. Long optional-parameter lists are also easy to call incorrectly by positional argument. Overloads (or named arguments) keep call sites explicit and make future changes safer.

## Bad

```csharp
public void Send(string to, string subject, string body,
    bool isHtml = false, int? retries = 3, TimeSpan? timeout = null, bool ccSelf = false)
{
    // 7 parameters, several optional - easy to miscall, and changing a default
    // later silently does nothing for callers compiled against the old default.
}

Send("a@b.com", "Hi", "body", true); // what does `true` mean without checking the signature?
```

## Good

```csharp
public void Send(string to, string subject, string body) =>
    Send(to, subject, body, SendOptions.Default);

public void Send(string to, string subject, string body, SendOptions options)
{
    // options is an explicit, named, extensible object - see api-required-members
}

public sealed class SendOptions
{
    public static SendOptions Default { get; } = new();

    public bool IsHtml { get; init; }
    public int Retries { get; init; } = 3;
    public TimeSpan Timeout { get; init; } = TimeSpan.FromSeconds(30);
    public bool CcSelf { get; init; }
}

// Explicit and self-documenting at the call site
Send("a@b.com", "Hi", "body", new SendOptions { IsHtml = true });
```

## Named Arguments for a Small Number of Optionals

```csharp
// For 1-2 optional parameters in application code (not a versioned public library),
// optional parameters plus named arguments at the call site can still be clear enough.
public void Log(string message, LogLevel level = LogLevel.Information) { /* ... */ }

Log("Starting up", level: LogLevel.Debug); // named argument keeps intent obvious
```

## See Also

- [api-builder-fluent](api-builder-fluent.md) - For construction with many optional configuration steps
- [api-required-members](api-required-members.md) - Enforcing which values are mandatory
