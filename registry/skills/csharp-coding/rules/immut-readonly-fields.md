# immut-readonly-fields

> Mark fields `readonly` unless the type genuinely needs to mutate them after construction

## Why It Matters

A `readonly` field can only be assigned in its declaration or in the declaring type's constructor, which the compiler enforces. This documents intent directly in the field declaration and prevents accidental reassignment anywhere else in the class as it grows over time.

## Bad

```csharp
public class OrderProcessor
{
    private IPaymentGateway _gateway; // mutable "by default", even though it never changes
    private ILogger _logger;

    public OrderProcessor(IPaymentGateway gateway, ILogger logger)
    {
        _gateway = gateway;
        _logger = logger;
    }

    public void Reconfigure(IPaymentGateway gateway) => _gateway = gateway;
    // A year later, someone adds this "for testing convenience" and now _gateway
    // is mutable in ways the rest of the class never expected.
}
```

## Good

```csharp
public class OrderProcessor
{
    private readonly IPaymentGateway _gateway;
    private readonly ILogger _logger;

    public OrderProcessor(IPaymentGateway gateway, ILogger logger)
    {
        _gateway = gateway;
        _logger = logger;
    }

    // _gateway = ...; // anywhere outside the constructor: compile error (CS0191)
}
```

## readonly Doesn't Make the Referenced Object Immutable

```csharp
public class Cache
{
    private readonly Dictionary<string, object> _entries = []; // the reference is fixed...

    public void Add(string key, object value) => _entries[key] = value; // ...but its CONTENTS can still change
}

// If you need the contents to be immutable too, use an immutable collection type -
// see immut-immutable-collections.
```

## Primary Constructors Auto-Generate readonly-Like Fields

```csharp
// Parameters captured by a primary constructor behave like readonly fields
// automatically when only read (not reassigned) in the body - see api-primary-constructor.
public class OrderProcessor(IPaymentGateway gateway, ILogger logger)
{
    public Task ProcessAsync(Order order) => gateway.ChargeAsync(order.Total);
}
```

## See Also

- [api-primary-constructor](api-primary-constructor.md) - Constructor capture and implicit readonly-like fields
- [immut-immutable-collections](immut-immutable-collections.md) - Immutability of contents, not just the reference
- [mem-readonly-struct](mem-readonly-struct.md) - readonly at the type level for structs
