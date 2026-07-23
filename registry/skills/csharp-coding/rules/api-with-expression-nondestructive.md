# api-with-expression-nondestructive

> Use `with` expressions for non-destructive mutation of records instead of manual copy-and-modify code

## Why It Matters

Immutable value objects need a way to produce a "changed" version without mutating the original or hand-writing a copy constructor for every combination of fields. `with` expressions do a compiler-generated shallow copy plus targeted overrides in one expression, staying in sync automatically as properties are added.

## Bad

```csharp
public class OrderLine
{
    public string Sku { get; }
    public int Quantity { get; }
    public decimal UnitPrice { get; }

    public OrderLine(string sku, int quantity, decimal unitPrice) =>
        (Sku, Quantity, UnitPrice) = (sku, quantity, unitPrice);

    // Hand-written "non-destructive update" - easy to forget a field when one is added
    public OrderLine WithQuantity(int quantity) => new(Sku, quantity, UnitPrice);
}
```

## Good

```csharp
public record OrderLine(string Sku, int Quantity, decimal UnitPrice);

var line = new OrderLine("SKU-1", 2, 9.99m);
var updated = line with { Quantity = 3 }; // Sku and UnitPrice carried over automatically

// Works with record struct too
public readonly record struct Point(double X, double Y);
var moved = new Point(1, 2) with { X = 5 };
```

## Multiple Property Updates

```csharp
var line = new OrderLine("SKU-1", 2, 9.99m);
var revised = line with { Quantity = 5, UnitPrice = 8.49m }; // update several fields at once
```

## `with` Does a Shallow Copy

```csharp
public record Cart(List<OrderLine> Lines);

var original = new Cart([new OrderLine("SKU-1", 1, 9.99m)]);
var copy = original with { }; // shallow copy - Lines is the SAME List<OrderLine> instance!

copy.Lines.Add(new OrderLine("SKU-2", 1, 4.99m));
// original.Lines now also has 2 items - the list reference was shared, not deep-copied.

// Fix: use an immutable collection type for reference-typed members
public record SafeCart(ImmutableList<OrderLine> Lines);
```

## See Also

- [api-record-value-data](api-record-value-data.md) - Records overview
- [immut-with-nondestructive-mutation](immut-with-nondestructive-mutation.md) - The immutability-category counterpart
- [immut-immutable-collections](immut-immutable-collections.md) - Avoiding the shallow-copy pitfall
