# name-camelcase-locals

> Use `camelCase` for local variables and method parameters

## Why It Matters

`camelCase` for locals/parameters visually distinguishes them from `PascalCase` type/member names at a glance, which matters constantly when reading code that mixes both (e.g. `order.Total` vs a local `total`). It's the universal convention across the .NET ecosystem and enforced by default in most `.editorconfig`/StyleCop rule sets.

## Bad

```csharp
public void ProcessOrder(Order Order, int RetryCount) // parameters should be camelCase
{
    var Total = Order.Total; // local should be camelCase
    var Is_Valid = Total > 0; // wrong case AND wrong separator style
}
```

## Good

```csharp
public void ProcessOrder(Order order, int retryCount)
{
    var total = order.Total;
    var isValid = total > 0;
}
```

## Lambda Parameters Follow the Same Rule

```csharp
var validOrders = orders.Where(order => order.Total > 0).ToList();
var pairs = dictionary.Select(kvp => (kvp.Key, kvp.Value));
```

## Out/Ref/In Parameters

```csharp
public bool TryParseAmount(string text, out decimal amount) // still camelCase
{
    return decimal.TryParse(text, out amount);
}
```

## See Also

- [name-pascalcase-public](name-pascalcase-public.md) - The public-member counterpart
- [name-underscore-private-fields](name-underscore-private-fields.md) - Private field convention
