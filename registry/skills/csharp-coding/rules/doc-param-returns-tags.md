# doc-param-returns-tags

> Document every parameter with `<param>` and every return value with `<returns>`

## Why It Matters

`<param>` and `<returns>` tags let IntelliSense show a description for each individual parameter as you type a call (not just the method's overall summary), and let generated API docs list each parameter's meaning and constraints. Missing tags leave gaps in otherwise-documented methods, and mismatched parameter names (after a rename) are flagged by the compiler.

## Bad

```csharp
/// <summary>Applies a percentage discount to a price.</summary>
public decimal ApplyDiscount(decimal price, decimal percentage)
{
    // No <param> tags - IntelliSense shows the summary but nothing about
    // what `price` or `percentage` individually mean, or what range is valid.
    return price * (1 - percentage);
}
```

## Good

```csharp
/// <summary>Applies a percentage discount to a price.</summary>
/// <param name="price">The original price before any discount.</param>
/// <param name="percentage">
/// The discount percentage, expressed as a fraction between 0.0 and 1.0 (e.g. 0.25 for 25%).
/// </param>
/// <returns>The discounted price.</returns>
public decimal ApplyDiscount(decimal price, decimal percentage) => price * (1 - percentage);
```

## Renaming a Parameter Keeps Documentation in Sync

```csharp
/// <param name="rate">The discount rate.</param> // <-- CS1572 warning if "rate" no longer
public decimal ApplyDiscount(decimal price, decimal percentage) => // matches an actual parameter name
    price * (1 - percentage);
```

## Documenting Generic Type Parameters Too

```csharp
/// <summary>Retrieves an entity by its identifier.</summary>
/// <typeparam name="TEntity">The entity type to retrieve.</typeparam>
/// <param name="id">The entity's unique identifier.</param>
/// <returns>The matching entity, or <see langword="null"/> if none was found.</returns>
public TEntity? GetById<TEntity>(int id) where TEntity : class => default;
```

## See Also

- [doc-xml-summary-public](doc-xml-summary-public.md) - The overall documentation pattern
- [doc-exception-tags](doc-exception-tags.md) - Documenting what a method throws
