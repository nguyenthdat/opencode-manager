# type-strongly-typed-ids

> Wrap primitive identifiers in strongly-typed wrapper structs/records instead of passing raw `int`/`Guid`

## Why It Matters

When every entity's ID is a raw `int` or `Guid`, the compiler can't stop you from passing a `CustomerId` where an `OrderId` was expected - both are just `int` to the type system. A dedicated type per ID kind turns that entire class of bug into a compile error.

## Bad

```csharp
public Order GetOrder(int orderId, int customerId) { /* ... */ return null!; }

var order = GetOrder(customerId, orderId); // arguments swapped - compiles fine, wrong at runtime
```

## Good

```csharp
public readonly record struct OrderId(int Value);
public readonly record struct CustomerId(int Value);

public Order GetOrder(OrderId orderId, CustomerId customerId) { /* ... */ return null!; }

// GetOrder(customerId, orderId); // CS1503: compile error - CustomerId is not an OrderId
var order = GetOrder(orderId, customerId); // only compiles in the correct order
```

## Adding Convenience Without Losing Safety

```csharp
public readonly record struct OrderId(int Value)
{
    public static OrderId New() => new(Random.Shared.Next());
    public override string ToString() => $"Order-{Value}";
}

// Implicit conversion FROM the primitive can ease adoption, but consider
// omitting it if you want maximum protection against accidental raw-int use.
public readonly record struct StrictOrderId(Guid Value)
{
    public static implicit operator Guid(StrictOrderId id) => id.Value; // TO primitive: usually safe
    // No implicit operator FROM Guid - forces explicit `new StrictOrderId(guid)` at construction sites
}
```

## EF Core Value Converters for Strongly-Typed IDs

```csharp
// Strongly-typed IDs need a value converter to map to/from the underlying
// database column type - EF Core supports this directly.
modelBuilder.Entity<Order>()
    .Property(o => o.Id)
    .HasConversion(id => id.Value, value => new OrderId(value));
```

## See Also

- [api-static-factory-methods](api-static-factory-methods.md) - Validated construction for ID-like types
- [immut-value-object-record](immut-value-object-record.md) - IDs as value objects
- [anti-primitive-obsession](anti-primitive-obsession.md) - The anti-pattern this rule fixes
