# linq-iqueryable-vs-ienumerable

> Know when `IQueryable<T>` pushes filtering/projection to the database vs. when it silently falls back to in-memory `IEnumerable<T>`

## Why It Matters

`IQueryable<T>` (as exposed by EF Core's `DbSet<T>`) builds an *expression tree* that the provider translates into SQL. Calling a method the provider can't translate (a custom C# method, certain string operations, non-translatable patterns) forces a silent switch to client-side evaluation - or, in older EF Core versions, materializes far more data than intended before filtering in memory.

## Bad

```csharp
public List<Order> GetRecentOrders(IQueryable<Order> orders)
{
    // AsEnumerable() (or an untranslatable predicate) pulls EVERY row into memory
    // FIRST, then filters in the app process instead of in the database.
    return orders
        .AsEnumerable()
        .Where(o => o.PlacedAt > DateTime.UtcNow.AddDays(-7))
        .ToList();
}

// Or, more subtly: calling a non-translatable custom method inside a Where
public List<Order> GetHighRisk(IQueryable<Order> orders) =>
    orders.Where(o => IsHighRisk(o)).ToList(); // EF Core cannot translate IsHighRisk into SQL
```

## Good

```csharp
public List<Order> GetRecentOrders(IQueryable<Order> orders)
{
    var cutoff = DateTime.UtcNow.AddDays(-7);
    return orders
        .Where(o => o.PlacedAt > cutoff) // translated into a SQL WHERE clause
        .ToList(); // materialization happens LAST, after filtering server-side
}

// Express the risk check with translatable operators/expressions
public List<Order> GetHighRisk(IQueryable<Order> orders) =>
    orders.Where(o => o.Total > 10_000m && o.Country != o.BillingCountry).ToList();
```

## IEnumerable<T> Runs Entirely In-Process

```csharp
// Once you have IEnumerable<T> (e.g. after ToList()), every subsequent LINQ
// operator runs in your application's memory, not the database - this is
// correct and expected for further, already-materialized processing.
List<Order> materialized = dbContext.Orders.Where(o => o.Total > 100).ToList(); // 1 SQL query
var highValue = materialized.Where(o => o.Total > 1000); // pure in-memory filtering, no more SQL
```

## Checking What Got Translated

```text
Enable EF Core's query logging (or QueryTranslationWarnings) in development to
catch client-side evaluation early - by default EF Core 5+ throws for expressions
it cannot translate instead of silently pulling the whole table into memory,
but it's still easy to introduce accidental full-table materialization.
```

## See Also

- [linq-deferred-execution-aware](linq-deferred-execution-aware.md) - Deferred execution fundamentals
- [linq-select-then-where-order](linq-select-then-where-order.md) - Filter/project ordering, relevant to both worlds
- [async-iasyncenumerable-streaming](async-iasyncenumerable-streaming.md) - Streaming query results asynchronously
