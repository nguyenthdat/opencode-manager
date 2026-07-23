# type-nullable-value-types

> Use `Nullable<T>`/`T?` for genuinely optional value types instead of magic sentinel values

## Why It Matters

Value types (`int`, `DateTime`, `decimal`, custom structs) can't be `null` by default - representing "no value" historically meant a sentinel like `-1`, `DateTime.MinValue`, or `0`, which is easy to confuse with a real, meaningful value and easy to forget to check for. `Nullable<T>` (`T?` for value types) makes "no value" a distinct, type-checked state.

## Bad

```csharp
public class Shipment
{
    // -1 means "not yet delivered"? DateTime.MinValue means "not scheduled"?
    // Nothing in the type signals this - it's tribal knowledge.
    public int DeliveryAttempts { get; set; } = -1;
    public DateTime DeliveredAt { get; set; } = DateTime.MinValue;
}

if (shipment.DeliveredAt != DateTime.MinValue) // easy to forget, easy to get wrong
{
    ShowDeliveryConfirmation(shipment.DeliveredAt);
}
```

## Good

```csharp
public class Shipment
{
    public int? DeliveryAttempts { get; set; }
    public DateTime? DeliveredAt { get; set; }
}

if (shipment.DeliveredAt is DateTime deliveredAt) // pattern match extracts the non-null value
{
    ShowDeliveryConfirmation(deliveredAt);
}

// Or with the classic member-based API
if (shipment.DeliveredAt.HasValue)
{
    ShowDeliveryConfirmation(shipment.DeliveredAt.Value);
}
```

## Working With Nullable Value Types

```csharp
int? maybeCount = GetCount();

var count = maybeCount ?? 0;               // null-coalescing default
var doubled = maybeCount * 2;               // lifted operators: null propagates through arithmetic
int? result = maybeCount.HasValue ? maybeCount.Value + 1 : null;

// GetValueOrDefault avoids an exception from .Value on a null Nullable<T>
var safeCount = maybeCount.GetValueOrDefault(defaultValue: 0);
```

## Don't Overuse Nullable Value Types Either

```csharp
// If "no value" genuinely can't happen for a field, don't make it nullable
// just to be defensive - that just pushes null-checks onto every consumer
// for a case that can never actually occur.
public DateTime CreatedAt { get; init; } // always set at construction - not nullable
```

## See Also

- [type-nullable-reference-types](type-nullable-reference-types.md) - The reference-type counterpart
- [err-exceptions-exceptional](err-exceptions-exceptional.md) - Nullable as an alternative to throwing for "not found"
