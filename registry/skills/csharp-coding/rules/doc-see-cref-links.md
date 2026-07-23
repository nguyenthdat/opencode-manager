# doc-see-cref-links

> Cross-reference related types and members in documentation with `<see cref="..."/>`

## Why It Matters

A plain-text mention of another type/method in a doc comment ("returns a Result") gives the reader no way to navigate there. `<see cref="..."/>` produces a clickable link in IDEs and generated documentation, and - critically - the compiler validates that the referenced member actually exists, catching stale references after a rename.

## Bad

```csharp
/// <summary>
/// Processes the order. See OrderValidator for the validation rules applied
/// before processing begins.
/// </summary>
public void Process(Order order) { }
// "OrderValidator" is just text - no link, no compiler validation it still exists
```

## Good

```csharp
/// <summary>
/// Processes the order. See <see cref="OrderValidator"/> for the validation
/// rules applied before processing begins.
/// </summary>
public void Process(Order order) { }
// Renaming OrderValidator without updating this comment produces CS1574: XML comment has cref attribute that could not be resolved
```

## Referencing Members, Not Just Types

```csharp
/// <summary>
/// Equivalent to calling <see cref="Validate(Order)"/> followed by
/// <see cref="Charge(Order)"/>, but atomically.
/// </summary>
public void ProcessAtomically(Order order) { }
```

## Referencing Generic Types and Overloads

```csharp
/// <summary>
/// Similar to <see cref="List{T}.Add(T)"/> but validates the item first.
/// </summary>
/// <seealso cref="Repository{TEntity}"/>
public void AddValidated<T>(T item) { }
```

## `<see langword="..."/>` for Keywords

```csharp
/// <returns><see langword="true"/> if valid; otherwise, <see langword="false"/>.</returns>
/// <returns>The result, or <see langword="null"/> if not found.</returns>
```

## See Also

- [doc-xml-summary-public](doc-xml-summary-public.md) - The base documentation pattern
- [doc-inheritdoc](doc-inheritdoc.md) - Avoiding duplicated documentation via inheritance
