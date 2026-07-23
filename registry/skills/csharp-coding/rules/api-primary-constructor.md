# api-primary-constructor

> Use primary constructors (C# 12+) to reduce boilerplate for simple construction and dependency injection

## Why It Matters

Before primary constructors, every class needed a hand-written constructor, private fields, and assignment statements just to store its dependencies/parameters. Primary constructors let the parameter list itself be the constructor, with parameters available directly in the class body - removing repetitive field declarations for straightforward cases.

## Bad

```csharp
public class OrderProcessor
{
    private readonly IPaymentGateway _gateway;
    private readonly ILogger<OrderProcessor> _logger;

    public OrderProcessor(IPaymentGateway gateway, ILogger<OrderProcessor> logger)
    {
        _gateway = gateway ?? throw new ArgumentNullException(nameof(gateway));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public Task ProcessAsync(Order order) => _gateway.ChargeAsync(order.Total);
}
```

## Good

```csharp
public class OrderProcessor(IPaymentGateway gateway, ILogger<OrderProcessor> logger)
{
    public Task ProcessAsync(Order order) => gateway.ChargeAsync(order.Total);
    // gateway/logger are captured as compiler-generated private fields automatically
}
```

## Guard Clauses With Primary Constructors

```csharp
public class OrderProcessor
{
    private readonly IPaymentGateway _gateway;

    public OrderProcessor(IPaymentGateway gateway)
    {
        ArgumentNullException.ThrowIfNull(gateway);
        _gateway = gateway;
    }
}

// With a primary constructor, validate in the class body (runs once, at construction)
public class OrderProcessorValidated(IPaymentGateway gateway)
{
    private readonly IPaymentGateway _gateway = gateway ?? throw new ArgumentNullException(nameof(gateway));
}
```

## When Not to Use Primary Constructors

```text
- Multiple constructors with different parameter sets - primary constructors
  support only one "primary" parameter list; additional constructors must
  chain to it with `: this(...)`, which gets awkward with more than 2-3 overloads.
- Complex construction logic (validation across several fields, derived state) -
  keep an explicit constructor body for clarity when it's more than trivial capture.
- The parameter is only used in ONE method - consider passing it as a regular
  method parameter instead of capturing it as implicit state for the whole class.
```

## See Also

- [api-required-members](api-required-members.md) - An alternative for object-initializer-style construction
- [immut-readonly-fields](immut-readonly-fields.md) - Related immutability practice
- [di-constructor-injection](di-constructor-injection.md) - Primary constructors pair naturally with DI
