# api-record-value-data

> Model immutable value data with `record`/`record struct`, not a hand-rolled class

## Why It Matters

Records generate value-based `Equals`/`GetHashCode`/`ToString`, a `with` expression for non-destructive updates, and (for positional records) deconstruction - all the boilerplate a value-like DTO needs, written once by the compiler instead of by hand and prone to being forgotten or getting out of sync when a property is added later.

## Bad

```csharp
public class Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency) => (Amount, Currency) = (amount, currency);

    public override bool Equals(object? obj) =>
        obj is Money other && Amount == other.Amount && Currency == other.Currency;

    public override int GetHashCode() => HashCode.Combine(Amount, Currency);

    public override string ToString() => $"{Amount} {Currency}";

    // Still missing: with-style non-destructive update, deconstruction, etc.
}
```

## Good

```csharp
public record Money(decimal Amount, string Currency);

var price = new Money(9.99m, "USD");
var discounted = price with { Amount = 7.99m }; // non-destructive update, free

Console.WriteLine(price == new Money(9.99m, "USD")); // True - value equality, free
Console.WriteLine(price); // "Money { Amount = 9.99, Currency = USD }" - free ToString
var (amount, currency) = price; // free deconstruction
```

## Records Are for Values, Not Entities

```csharp
// A domain entity with identity (e.g. a database row with a mutable lifecycle)
// is usually still better as a class - see immut-value-object-record for the
// value-object-vs-entity distinction.
public class Order // entity: identity matters more than structural equality
{
    public Guid Id { get; init; }
    public OrderStatus Status { get; set; } // legitimately mutable over its lifecycle
}

public record Money(decimal Amount, string Currency); // value object: pure data
```

## record vs record struct

```csharp
// record  -> reference type, heap-allocated, best for larger/optional value data
// record struct -> value type, stack-allocated/copied, best for small, frequently-copied data
public record struct Point(double X, double Y);
```

## See Also

- [immut-value-object-record](immut-value-object-record.md) - Value objects vs entities
- [immut-record-struct-small-value](immut-record-struct-small-value.md) - Choosing record struct
- [api-with-expression-nondestructive](api-with-expression-nondestructive.md) - The `with` expression in depth
