# name-plural-collections

> Name collection-typed members and variables with plural nouns

## Why It Matters

A plural name (`Orders`, `Items`, `Users`) immediately signals "this holds many" without needing to check the type annotation, and reads naturally in `foreach` loops and LINQ chains (`foreach (var order in orders)`). A singular name for a collection (`Order`, `Item`) is actively misleading.

## Bad

```csharp
public class Cart
{
    public List<OrderLine> Item { get; init; } = []; // singular name for a collection - misleading
}

foreach (var line in cart.Item) // reads awkwardly - "Item" implies one thing
{
    Process(line);
}
```

## Good

```csharp
public class Cart
{
    public List<OrderLine> Items { get; init; } = [];
}

foreach (var item in cart.Items) // reads naturally: "for each item in items"
{
    Process(item);
}
```

## Dictionaries: Name for What's Looked Up, Often Still Plural or Descriptive

```csharp
public class UserDirectory
{
    // Plural-of-value or a "byKey" style both read clearly for dictionaries
    public Dictionary<int, User> UsersById { get; init; } = [];
    // or: public Dictionary<int, User> Users { get; init; } = [];
}
```

## Booleans and Counts Stay Singular

```csharp
// This rule is specifically about the collection itself - a derived scalar
// (count, flag) describing the collection should NOT also be pluralized.
public int ItemCount => Items.Count;   // singular - it's a single number
public bool HasItems => Items.Count > 0; // singular - it's a single boolean
```

## See Also

- [name-pascalcase-public](name-pascalcase-public.md) - General naming conventions
- [name-boolean-is-has-can](name-boolean-is-has-can.md) - Naming for booleans specifically
