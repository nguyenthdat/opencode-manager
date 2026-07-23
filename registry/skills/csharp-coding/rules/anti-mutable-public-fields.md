# anti-mutable-public-fields

> Don't expose mutable public fields on classes

## Why It Matters

Public fields can't be validated, can't be made read-only after the fact without breaking binary compatibility, and can't be swapped for computed logic later without a breaking API change - all things a property gives you for free, at effectively zero cost at the call site.

## Bad

```csharp
public class Order
{
    public decimal Total; // no validation, no encapsulation, binary-fragile if changed to a property later
}

var order = new Order();
order.Total = -50m; // nothing prevents an invalid negative total
```

## Good

```csharp
public class Order
{
    public decimal Total { get; set; }
}

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

## `const`/`static readonly` Fields Are the Accepted Exception

```csharp
public class Defaults
{
    public const int MaxRetries = 3; // compile-time constant, not instance state
    public static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(30);
}
```

## See Also

- [immut-avoid-mutable-public-fields](immut-avoid-mutable-public-fields.md) - The full rule with more detail
- [api-init-only-properties](api-init-only-properties.md) - The construction-time-only alternative
