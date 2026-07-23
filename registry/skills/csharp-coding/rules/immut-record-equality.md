# immut-record-equality

> Understand that records give value-based equality, not reference equality - and know when that's the wrong default

## Why It Matters

`record`/`record struct` generate `Equals`/`GetHashCode` that compare all properties by value, unlike a plain `class` where `==` and `.Equals()` default to reference identity. This is exactly right for value objects (money, coordinates, DTOs) but wrong for entities where two instances with the same data are NOT necessarily "the same thing" (e.g. two different orders that happen to have identical totals).

## Bad

```csharp
public record Order(Guid Id, decimal Total); // entity modeled as a record

var order1 = new Order(Guid.NewGuid(), 100m);
var order2 = new Order(Guid.NewGuid(), 100m);
var order3 = order1 with { }; // same Id, same Total

Console.WriteLine(order1 == order2); // False - different Ids, as expected
Console.WriteLine(order1 == order3); // True - but is a "copy" really the same order in a Dictionary/HashSet?

var seen = new HashSet<Order> { order1 };
Console.WriteLine(seen.Contains(order3)); // True - value equality, not identity, may surprise callers
```

## Good

```csharp
// Value object: value-based equality is exactly right
public record Money(decimal Amount, string Currency);
Console.WriteLine(new Money(10m, "USD") == new Money(10m, "USD")); // True - correct

// Entity: use a class with identity-based equality (often just Id comparison)
public class Order
{
    public Guid Id { get; init; }
    public decimal Total { get; set; }

    public override bool Equals(object? obj) => obj is Order other && Id == other.Id;
    public override int GetHashCode() => Id.GetHashCode();
}
```

## Records With Reference-Typed Members

```csharp
// Records only compare what THEY define equality over; be careful with mutable
// or reference-typed members - two records can be "equal" while containing
// arrays/lists that are reference-equal (or not deeply compared as expected).
public record Batch(int[] Values);

var a = new Batch([1, 2, 3]);
var b = new Batch([1, 2, 3]);
Console.WriteLine(a == b); // False! int[] uses reference equality even inside a record

public record SafeBatch(ImmutableArray<int> Values); // ImmutableArray compares by value with SequenceEqual semantics if you implement it, or use IStructuralEquatable-aware members
```

## See Also

- [immut-value-object-record](immut-value-object-record.md) - Value objects vs entities
- [type-record-for-equality](type-record-for-equality.md) - Records as an alternative to manual Equals/GetHashCode
- [api-record-value-data](api-record-value-data.md) - Records overview
