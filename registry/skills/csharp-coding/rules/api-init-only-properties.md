# api-init-only-properties

> Use `init`-only properties for data that should be set at construction and never mutated afterward

## Why It Matters

A plain `{ get; set; }` property can be reassigned at any time by any caller with a reference to the object, making it hard to reason about invariants. `init` accessors allow setting the value only during object initialization (constructor or object initializer syntax), giving you immutability without giving up the convenience of object initializers.

## Bad

```csharp
public class Address
{
    public string Street { get; set; } = "";
    public string City { get; set; } = "";
}

var address = new Address { Street = "1 Main St", City = "Springfield" };

// Nothing stops this later, anywhere in the codebase:
address.City = "Somewhere Else"; // silent, hard-to-trace mutation
```

## Good

```csharp
public class Address
{
    public required string Street { get; init; }
    public required string City { get; init; }
}

var address = new Address { Street = "1 Main St", City = "Springfield" };

// address.City = "Somewhere Else"; // CS8852: compile error - init-only outside construction
```

## Non-Destructive Updates With `with` (Records)

```csharp
public record Address(string Street, string City); // positional record: init-only by default

var original = new Address("1 Main St", "Springfield");
var moved = original with { City = "Shelbyville" }; // creates a new instance, original unchanged
```

## Combining With Validation

```csharp
public class Money
{
    public required decimal Amount { get; init; }
    public required string Currency { get; init; }

    public Money()
    {
        // Validation can still run via a parameterless constructor + init setters,
        // though a factory method is often clearer for cross-field validation -
        // see api-static-factory-methods.
    }
}
```

## See Also

- [api-required-members](api-required-members.md) - Making init-only properties mandatory
- [immut-with-nondestructive-mutation](immut-with-nondestructive-mutation.md) - The `with` expression pattern
- [immut-avoid-mutable-public-fields](immut-avoid-mutable-public-fields.md) - Related immutability rule
