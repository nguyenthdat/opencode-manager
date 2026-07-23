# err-argumentnull-throwifnull

> Use `ArgumentNullException.ThrowIfNull` (and sibling guard helpers) for parameter validation

## Why It Matters

Hand-written null checks are verbose and inconsistent (`nameof` typos, wrong exception type, missing checks). `ArgumentNullException.ThrowIfNull` (.NET 6+) and `ArgumentException.ThrowIfNullOrEmpty`/`ThrowIfNullOrWhiteSpace` (.NET 8+) are single-line, allocation-free-on-the-happy-path, and automatically capture the parameter name via `CallerArgumentExpression`.

## Bad

```csharp
public void Configure(string? connectionString, ILogger logger)
{
    if (connectionString == null)
    {
        throw new ArgumentNullException(nameof(connectionString)); // easy to typo the nameof
    }
    if (logger == null)
    {
        throw new ArgumentNullException("logger"); // magic string, breaks on rename
    }
    if (connectionString.Length == 0)
    {
        throw new ArgumentException("Connection string cannot be empty.", nameof(connectionString));
    }
}
```

## Good

```csharp
public void Configure(string? connectionString, ILogger logger)
{
    ArgumentNullException.ThrowIfNull(logger);
    ArgumentException.ThrowIfNullOrWhiteSpace(connectionString); // null, empty, or whitespace-only

    // ... use the validated values
}

// Works for any reference type or nullable value type
public void SetTimeout(int? seconds)
{
    ArgumentNullException.ThrowIfNull(seconds);
    ArgumentOutOfRangeException.ThrowIfNegative(seconds.Value);
}
```

## Full Guard Family (.NET 8+)

```csharp
ArgumentNullException.ThrowIfNull(value);
ArgumentException.ThrowIfNullOrEmpty(text);
ArgumentException.ThrowIfNullOrWhiteSpace(text);
ArgumentOutOfRangeException.ThrowIfNegative(count);
ArgumentOutOfRangeException.ThrowIfNegativeOrZero(count);
ArgumentOutOfRangeException.ThrowIfGreaterThan(value, max);
ArgumentOutOfRangeException.ThrowIfEqual(a, b);
```

## Primary Constructor Guard Clauses

```csharp
public sealed class OrderProcessor(IPaymentGateway gateway, ILogger<OrderProcessor> logger)
{
    private readonly IPaymentGateway _gateway = gateway ?? throw new ArgumentNullException(nameof(gateway));
    private readonly ILogger _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    // Or, equivalently and more consistently:
    // ArgumentNullException.ThrowIfNull(gateway);
    // ArgumentNullException.ThrowIfNull(logger);
}
```

## See Also

- [err-exception-message-quality](err-exception-message-quality.md) - Writing good exception messages
- [api-primary-constructor](api-primary-constructor.md) - Guard clauses with primary constructors
- [type-nullable-reference-types](type-nullable-reference-types.md) - Making nullability explicit in the first place
