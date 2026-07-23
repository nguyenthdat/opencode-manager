# name-boolean-is-has-can

> Name boolean properties/methods with `Is`/`Has`/`Can`/`Should` prefixes so their meaning reads as a question

## Why It Matters

A boolean named `Active` or `Valid` is ambiguous at the call site (`order.Active = true;` reads like an imperative command, not a state check). Prefixing with `Is`/`Has`/`Can`/`Should` makes the boolean read as a yes/no question, which is unambiguous both when declared and when used in a condition.

## Bad

```csharp
public class Order
{
    public bool Valid { get; set; }
    public bool Discount { get; set; } // is this "has a discount" or "is discounted"? unclear
    public bool Retry { get; set; }    // reads like a command, not a flag
}

if (order.Valid) { /* ... */ } // acceptable but "IsValid" reads more naturally as a condition
```

## Good

```csharp
public class Order
{
    public bool IsValid { get; set; }
    public bool HasDiscount { get; set; }
    public bool CanRetry { get; set; }
    public bool ShouldNotifyCustomer { get; set; }
}

if (order.IsValid && order.HasDiscount)
{
    ApplyDiscount(order);
}
```

## Applies to Methods Too

```csharp
public bool IsEligibleForDiscount(Order order) => order.Total > 100;
public bool HasPendingItems(Cart cart) => cart.Items.Any(i => i.IsPending);
public bool CanCancel(Order order) => order.Status == OrderStatus.Pending;
```

## Avoid Negated Boolean Names

```csharp
// Double negatives read badly: !order.IsNotValid
public bool IsNotValid { get; set; } // BAD

// Prefer the positive form and negate at the call site if needed
public bool IsValid { get; set; } // GOOD
if (!order.IsValid) { /* ... */ }
```

## See Also

- [name-pascalcase-public](name-pascalcase-public.md) - General naming conventions
- [type-enum-design](type-enum-design.md) - When a bool should really be an enum instead
