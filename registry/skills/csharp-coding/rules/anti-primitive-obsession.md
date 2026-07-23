# anti-primitive-obsession

> Don't pass a swarm of raw primitive parameters instead of a well-named type

## Why It Matters

A method with several same-typed primitive parameters in a row (`int`, `int`, `decimal`, `decimal`) is easy to call with arguments in the wrong order - the compiler can't catch it because they're all technically the same type. Wrapping related primitives in a small, named type makes such mistakes a compile error instead of a runtime bug.

## Bad

```csharp
public void CreateShipment(int orderId, int customerId, decimal weight, decimal declaredValue)
{
    // ...
}

CreateShipment(customerId, orderId, declaredValue, weight); // all four arguments swapped - compiles fine!
```

## Good

```csharp
public readonly record struct OrderId(int Value);
public readonly record struct CustomerId(int Value);
public record ShipmentDetails(decimal Weight, decimal DeclaredValue);

public void CreateShipment(OrderId orderId, CustomerId customerId, ShipmentDetails details)
{
    // ...
}

// CreateShipment(customerId, orderId, details); // compile error - types don't match anymore
CreateShipment(orderId, customerId, details); // only compiles in the correct order
```

## See Also

- [type-strongly-typed-ids](type-strongly-typed-ids.md) - The full rule with more detail
- [immut-value-object-record](immut-value-object-record.md) - Value objects as the general fix
