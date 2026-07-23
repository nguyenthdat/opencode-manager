# linq-select-then-where-order

> Filter with `Where` before projecting with `Select` to avoid transforming elements you'll discard

## Why It Matters

`Select` runs its projection function on every element it receives. If `Select` runs before `Where`, you pay the (possibly expensive) projection cost for elements that get filtered out immediately afterward. Filtering first reduces the number of elements that ever reach the projection step.

## Bad

```csharp
var summaries = orders
    .Select(o => BuildExpensiveSummary(o)) // runs for EVERY order, including ones filtered out next
    .Where(s => s.Total > 100);
```

## Good

```csharp
var summaries = orders
    .Where(o => o.Total > 100) // filter first - cheap comparison on the raw order
    .Select(o => BuildExpensiveSummary(o)); // only runs for orders that passed the filter
```

## When Order Doesn't Matter

```csharp
// If the predicate depends on data produced BY the projection, you have no choice
// but to project first - this is a legitimate exception, not a violation of the rule.
var results = orders
    .Select(o => new { Order = o, Summary = BuildSummary(o) })
    .Where(x => x.Summary.RequiresReview);
```

## LINQ to SQL/EF: Let the Provider Decide

```csharp
// Against IQueryable<T> (e.g. Entity Framework Core), the provider translates
// the whole expression tree into SQL and its own query optimizer decides
// execution order - this rule matters most for in-memory IEnumerable<T> LINQ.
var query = dbContext.Orders
    .Where(o => o.Total > 100)
    .Select(o => new OrderSummaryDto(o.Id, o.Total)); // becomes a single, optimized SQL query
```

## See Also

- [linq-deferred-execution-aware](linq-deferred-execution-aware.md) - Understanding when this code actually runs
- [linq-iqueryable-vs-ienumerable](linq-iqueryable-vs-ienumerable.md) - In-memory vs provider-translated LINQ
- [perf-avoid-linq-hot-path](perf-avoid-linq-hot-path.md) - Related LINQ performance guidance
