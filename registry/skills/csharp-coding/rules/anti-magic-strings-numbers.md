# anti-magic-strings-numbers

> Don't scatter magic strings/numbers through the code; name them as constants

## Why It Matters

A bare `3` or `"Pending"` repeated across the codebase gives no clue what it means, can't be changed in one place, and can silently drift when one occurrence is updated but another is missed. A named constant documents intent and gives every use site a single, updatable source of truth.

## Bad

```csharp
public bool ShouldRetry(int attempt) => attempt < 3; // what does 3 represent? why 3?

public bool IsPending(Order order) => order.Status == "Pending"; // typo-prone string literal
```

## Good

```csharp
public class RetryPolicy
{
    public const int MaxAttempts = 3;

    public bool ShouldRetry(int attempt) => attempt < MaxAttempts;
}

public enum OrderStatus { Pending, Shipped, Delivered } // enum instead of a magic string entirely

public bool IsPending(Order order) => order.Status == OrderStatus.Pending;
```

## Repeated Literals Across Multiple Files Are the Clearest Signal

```csharp
// If the SAME literal shows up in three unrelated files, that's the strongest
// sign it needs a name - the next change to that value will inevitably miss one.
if (retryCount > 3) { }         // file A
for (var i = 0; i < 3; i++) { } // file B - is this the SAME "3" as file A, coincidentally, or unrelated?
```

## See Also

- [name-constants-pascalcase](name-constants-pascalcase.md) - Naming conventions for constants
- [type-enum-design](type-enum-design.md) - Enums as the fix for magic strings representing states
- [type-strongly-typed-ids](type-strongly-typed-ids.md) - The related fix for magic/raw identifier values
