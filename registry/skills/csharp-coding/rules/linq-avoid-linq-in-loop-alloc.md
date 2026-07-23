# linq-avoid-linq-in-loop-alloc

> Hoist LINQ queries that don't depend on the loop variable out of the loop instead of re-running them each iteration

## Why It Matters

Running a LINQ query inside a loop body when its inputs don't change per-iteration repeats the same work (and the same allocations) every single time through the loop. Hoisting the query out to before the loop computes it once.

## Bad

```csharp
public void ApplyDiscounts(List<Order> orders)
{
    foreach (var order in orders)
    {
        // Recomputed on every iteration, even though `premiumSkus` never changes
        var premiumSkus = _catalog.Products.Where(p => p.IsPremium).Select(p => p.Sku).ToHashSet();

        if (premiumSkus.Contains(order.Sku))
        {
            order.Total *= 0.9m;
        }
    }
}
```

## Good

```csharp
public void ApplyDiscounts(List<Order> orders)
{
    var premiumSkus = _catalog.Products.Where(p => p.IsPremium).Select(p => p.Sku).ToHashSet();
    // Computed once, reused for every order

    foreach (var order in orders)
    {
        if (premiumSkus.Contains(order.Sku))
        {
            order.Total *= 0.9m;
        }
    }
}
```

## Watch for Hidden Recomputation in LINQ Chains Too

```csharp
// The same mistake, expressed entirely in LINQ, is just as easy to write:
var discounted = orders.Select(o => new
{
    Order = o,
    // BAD: this Where/Select recomputes premiumSkus for every single order!
    IsPremium = _catalog.Products.Where(p => p.IsPremium).Select(p => p.Sku).Contains(o.Sku)
});

// GOOD: compute once, capture it in the closure
var premiumSkus = _catalog.Products.Where(p => p.IsPremium).Select(p => p.Sku).ToHashSet();
var discounted2 = orders.Select(o => new { Order = o, IsPremium = premiumSkus.Contains(o.Sku) });
```

## See Also

- [linq-avoid-multiple-enumeration](linq-avoid-multiple-enumeration.md) - A related repeated-work pitfall
- [perf-avoid-linq-hot-path](perf-avoid-linq-hot-path.md) - Performance-category guidance for hot loops
