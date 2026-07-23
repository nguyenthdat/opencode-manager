# immut-value-object-record

> Model domain value objects as immutable records; reserve mutable classes for entities with identity

## Why It Matters

Domain-Driven Design distinguishes value objects (defined entirely by their attributes - two `Money(10, "USD")` instances are interchangeable) from entities (defined by identity - two `Customer` instances with identical names are still different customers). Records are a near-perfect language-level fit for value objects: immutable, value-equal, and cheap to construct via `with`.

## Bad

```csharp
public class Money // mutable class used for something that is purely a value
{
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "";
}

var price = new Money { Amount = 10m, Currency = "USD" };
ApplyDiscount(price); // might mutate `price` in place - surprising for something value-like

void ApplyDiscount(Money money) => money.Amount *= 0.9m; // silent mutation of shared state
```

## Good

```csharp
public record Money(decimal Amount, string Currency)
{
    public Money ApplyDiscount(decimal percentage) => this with { Amount = Amount * (1 - percentage) };
}

var price = new Money(10m, "USD");
var discounted = price.ApplyDiscount(0.1m); // returns a new value; `price` is untouched
```

## Entities Stay as Classes With Identity

```csharp
public class Customer // entity: identity (Id) matters more than the current attribute values
{
    public Guid Id { get; init; }
    public string Name { get; set; } = ""; // legitimately mutable over the entity's lifetime

    public override bool Equals(object? obj) => obj is Customer other && Id == other.Id;
    public override int GetHashCode() => Id.GetHashCode();
}
```

## A Value Object Composed of Other Value Objects

```csharp
public record Address(string Street, string City, string PostalCode);
public record Order(Guid Id, Address ShippingAddress, ImmutableList<Money> LineTotals);
// Order is an entity (has Id) that CONTAINS value objects (Address, Money) - a common,
// correct mix in DDD-influenced domain models.
```

## See Also

- [immut-record-equality](immut-record-equality.md) - Why value equality matters here specifically
- [api-record-value-data](api-record-value-data.md) - Records overview
- [type-strongly-typed-ids](type-strongly-typed-ids.md) - Wrapping entity identifiers as value objects too
