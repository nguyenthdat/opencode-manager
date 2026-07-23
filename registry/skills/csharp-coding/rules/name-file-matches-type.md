# name-file-matches-type

> Name each file after the single public type it contains

## Why It Matters

When `OrderProcessor.cs` contains exactly `class OrderProcessor`, anyone (or any tool - "Go to Definition", search-by-filename) can find a type instantly without opening files. Multiple unrelated public types crammed into one file, or a file named differently from its main type, breaks that predictability as a codebase grows past a handful of files.

## Bad

```csharp
// File: Helpers.cs
public class OrderProcessor { /* ... */ }
public class InvoiceGenerator { /* ... */ }
public class PaymentValidator { /* ... */ }
// Three unrelated public types, none matching the filename - none easily findable by name
```

## Good

```csharp
// File: OrderProcessor.cs
public class OrderProcessor { /* ... */ }
```

```csharp
// File: InvoiceGenerator.cs
public class InvoiceGenerator { /* ... */ }
```

```csharp
// File: PaymentValidator.cs
public class PaymentValidator { /* ... */ }
```

## Small, Tightly-Coupled Private Types Are a Reasonable Exception

```csharp
// File: OrderProcessor.cs - a small, private helper type used only by OrderProcessor
// is fine to keep in the same file; it's not part of the public API surface.
public class OrderProcessor
{
    public void Process(Order order) { /* ... */ }

    private sealed class ProcessingContext // implementation detail, not separately discoverable
    {
        public int Attempts { get; set; }
    }
}
```

## Partial Classes Span Multiple Files by Design

```csharp
// File: OrderProcessor.cs
public partial class OrderProcessor { /* ... */ }

// File: OrderProcessor.Validation.cs - suffix communicates which "slice" this file covers
public partial class OrderProcessor
{
    private bool Validate(Order order) => order.Total > 0;
}
```

## See Also

- [proj-namespace-folder-structure](proj-namespace-folder-structure.md) - Related folder/file organization
- [api-sealed-by-default](api-sealed-by-default.md) - Related type-design discipline
