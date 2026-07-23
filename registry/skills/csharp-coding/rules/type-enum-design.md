# type-enum-design

> Design enums deliberately: explicit values for anything persisted, `[Flags]` only for genuinely combinable options

## Why It Matters

An enum without explicit values silently renumbers every member if one is inserted in the middle, which is catastrophic for anything persisted to a database or serialized across versions (a stored `2` now means something different). `[Flags]` enums that aren't actually bitwise-combinable, or non-flags enums combined with `|` by mistake, produce nonsensical states that compile without warning.

## Bad

```csharp
public enum OrderStatus // no explicit values - inserting a member shifts every later value
{
    Pending,
    Shipped, // = 1
    Delivered, // = 2
    Cancelled // = 3
}
// A year later, someone inserts "Processing" between Pending and Shipped -
// every stored "Shipped" (1) in the database now silently means "Processing".
```

## Good

```csharp
public enum OrderStatus // explicit, stable values - safe to insert new members anywhere
{
    Pending = 0,
    Processing = 1,
    Shipped = 2,
    Delivered = 3,
    Cancelled = 4
    // A newly added member gets a NEW explicit value, never colliding with a stored one.
}
```

## `[Flags]` for Genuinely Combinable Options

```csharp
[Flags]
public enum FilePermissions
{
    None = 0,
    Read = 1 << 0,
    Write = 1 << 1,
    Execute = 1 << 2,
    All = Read | Write | Execute
}

var permissions = FilePermissions.Read | FilePermissions.Write; // valid combination
bool canWrite = permissions.HasFlag(FilePermissions.Write);
```

## Don't Combine Non-Flags Enums

```csharp
public enum OrderStatus { Pending, Shipped, Delivered } // NOT [Flags] - mutually exclusive states

// var invalid = OrderStatus.Pending | OrderStatus.Shipped; // compiles, but is meaningless -
// OrderStatus represents ONE state at a time, not a combination.
```

## Adding a Description/Display Name

```csharp
public enum OrderStatus
{
    [Display(Name = "Pending Payment")]
    Pending = 0,

    [Display(Name = "Shipped")]
    Shipped = 2
}
```

## See Also

- [type-switch-expression-exhaustive](type-switch-expression-exhaustive.md) - Handling every enum value safely
- [name-boolean-is-has-can](name-boolean-is-has-can.md) - When a bool would be simpler than an enum (and vice versa)
