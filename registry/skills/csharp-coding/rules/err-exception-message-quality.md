# err-exception-message-quality

> Write exception messages that state what failed, why, and what the caller can do about it

## Why It Matters

"Invalid input", "Error occurred", or a bare rethrown `ex.Message` gives an on-call engineer nothing to act on at 3am. A good exception message identifies the failing value/operation, the reason, and - where relevant - a hint at the fix, without leaking secrets (connection strings, tokens, PII).

## Bad

```csharp
public void SetPort(int port)
{
    if (port is < 1 or > 65535)
    {
        throw new ArgumentException("Invalid input");
    }
}

public Config Load(string path)
{
    if (!File.Exists(path))
    {
        throw new Exception("Error"); // which file? which operation? no context at all
    }
    // ...
}
```

## Good

```csharp
public void SetPort(int port)
{
    if (port is < 1 or > 65535)
    {
        throw new ArgumentOutOfRangeException(
            nameof(port), port, "Port must be between 1 and 65535.");
    }
}

public Config Load(string path)
{
    if (!File.Exists(path))
    {
        throw new FileNotFoundException(
            $"Configuration file not found at '{path}'. " +
            "Ensure the app is run from the correct working directory.",
            path);
    }
    // ...
}
```

## Don't Leak Sensitive Data

```csharp
// BAD: connection string (often contains a password) ends up in logs/telemetry
throw new InvalidOperationException($"Failed to connect using '{connectionString}'.");

// GOOD: identify the target without the secret
throw new InvalidOperationException(
    $"Failed to connect to database '{databaseName}' on '{serverHost}'.");
```

## Include Actionable Values, Not Just Prose

```csharp
public void Validate(Order order)
{
    if (order.Total < 0)
    {
        throw new ArgumentException(
            $"Order total must be non-negative, but was {order.Total} for order {order.Id}.",
            nameof(order));
    }
}
```

## See Also

- [err-argumentnull-throwifnull](err-argumentnull-throwifnull.md) - Standard guard-clause helpers
- [err-custom-hierarchy](err-custom-hierarchy.md) - Where structured error data belongs
- [doc-exception-tags](doc-exception-tags.md) - Documenting what a method throws and when
