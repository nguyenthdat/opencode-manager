# mem-struct-vs-class

> Choose `struct` vs `class` based on size, mutability, and identity semantics - not habit

## Why It Matters

Structs are copied by value on assignment, parameter passing, and return; large structs multiply copy costs, and mutable structs create surprising bugs (mutating a copy instead of the original). Classes have reference identity and heap allocation/GC overhead. Picking the wrong one causes either performance problems (large structs copied everywhere) or correctness bugs (structs assumed to have reference semantics).

## Bad

```csharp
// Large struct - every assignment/parameter pass copies 100+ bytes
public struct OrderSnapshot
{
    public Guid Id;
    public string CustomerName;
    public DateTime PlacedAt;
    public decimal Total;
    public Address ShippingAddress; // itself a large struct
    public List<OrderLine> Lines;   // reference type field is fine, but struct itself is huge
}

// Mutable struct stored in a collection - mutation silently no-ops
public struct Counter
{
    public int Value;
    public void Increment() => Value++;
}

var counters = new List<Counter> { new() };
counters[0].Increment(); // CS1612 on properties; even with fields, easy to misuse via boxing
```

## Good

```csharp
// Small, immutable value -> struct (ideally readonly struct / record struct)
public readonly record struct Point(double X, double Y);

// Identity matters, or large/mutable data -> class
public sealed class Order
{
    public Guid Id { get; init; }
    public string CustomerName { get; init; } = "";
    public DateTime PlacedAt { get; init; }
    public decimal Total { get; init; }
    public Address ShippingAddress { get; init; } = new();
    public List<OrderLine> Lines { get; init; } = [];
}

// Mutable state that must be shared/observed by reference -> class
public sealed class Counter
{
    public int Value { get; private set; }
    public void Increment() => Value++;
}
```

## Decision Guide

```text
Use a struct when ALL of these hold:
  - Logically represents a single value (like an int, a coordinate, a money amount)
  - Immutable, or mutation is entirely local and never shared
  - Small (Microsoft guidance: generally <= 16 bytes, always measure for your case)
  - No need for reference/identity semantics or inheritance

Otherwise, use a class.
```

## See Also

- [mem-readonly-struct](mem-readonly-struct.md) - Making structs safely immutable
- [immut-record-struct-small-value](immut-record-struct-small-value.md) - Record struct for small values
- [mem-avoid-boxing](mem-avoid-boxing.md) - Boxing cost when structs meet `object`
