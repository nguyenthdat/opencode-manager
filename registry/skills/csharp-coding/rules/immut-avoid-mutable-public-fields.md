# immut-avoid-mutable-public-fields

> Never expose mutable public fields; use properties (or `init`/`required` properties) instead

## Why It Matters

A public field can't be validated on assignment, can't be made read-only after construction without a breaking change, can't be observed (no `INotifyPropertyChanged`-style hook), and can't be replaced later with computed logic without breaking every caller's compiled code (fields and properties are binary-incompatible). Properties cost nothing at the call site but keep all of these doors open.

## Bad

```csharp
public class Order
{
    public decimal Total; // public field - no validation, no encapsulation, binary-fragile
}

var order = new Order();
order.Total = -50m; // nothing stops an invalid negative total
```

## Good

```csharp
public class Order
{
    public decimal Total { get; set; }
    // Or, if construction-only:
    // public required decimal Total { get; init; }
}

// Validation can be added later without breaking callers
public class ValidatedOrder
{
    private decimal _total;
    public decimal Total
    {
        get => _total;
        set => _total = value >= 0 ? value : throw new ArgumentOutOfRangeException(nameof(value));
    }
}
```

## Public `const`/`static readonly` Fields Are Fine

```csharp
// This rule targets INSTANCE state, not compile-time constants or well-known
// singleton-style static values, which are conventionally public fields.
public class Defaults
{
    public const int MaxRetries = 3;
    public static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(30);
}
```

## See Also

- [api-init-only-properties](api-init-only-properties.md) - init-only properties for construction-time data
- [immut-readonly-fields](immut-readonly-fields.md) - readonly for private fields
- [anti-mutable-public-fields](anti-mutable-public-fields.md) - Anti-pattern reference
