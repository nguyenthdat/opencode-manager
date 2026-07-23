# linq-orderby-stable

> Rely on `OrderBy`/`OrderByDescending`'s documented stability; chain `ThenBy` for explicit tiebreakers

## Why It Matters

LINQ's `OrderBy` is guaranteed to be a stable sort - elements that compare equal on the sort key retain their original relative order. This is useful (you can sort by a secondary key first, then a primary key, and equal-primary-key groups stay in secondary order) but only if you know to use `ThenBy` for explicit, readable tiebreakers instead of relying on incidental input order.

## Bad

```csharp
// Relies on "orders happens to already be sorted by Id" as an implicit tiebreaker -
// fragile and non-obvious to a future reader/maintainer.
var sorted = orders.OrderBy(o => o.CustomerName); // assumes input order provides the tiebreak
```

## Good

```csharp
// Explicit, self-documenting tiebreaker - readable regardless of input order
var sorted = orders
    .OrderBy(o => o.CustomerName)
    .ThenBy(o => o.Id);
```

## Multiple Sort Keys

```csharp
var sorted = employees
    .OrderBy(e => e.Department)
    .ThenByDescending(e => e.Salary)
    .ThenBy(e => e.LastName);
```

## OrderBy Materializes Immediately-ish, But Still Deferred

```csharp
// OrderBy itself is still deferred (query composition), but once enumerated it
// must buffer and sort the ENTIRE sequence before yielding the first element -
// unlike Where/Select, it cannot short-circuit or stream incrementally.
var top10 = orders.OrderByDescending(o => o.Total).Take(10); // still sorts everything internally
```

## Sorting In Place vs Creating a New Sequence

```csharp
// List<T>.Sort() sorts in place and is NOT guaranteed stable (uses an
// introspective/unstable sort) - use OrderBy()/ToList() if stability matters.
var list = orders.ToList();
list.Sort((a, b) => a.CustomerName.CompareTo(b.CustomerName)); // may reorder equal-key elements

var stableSorted = orders.OrderBy(o => o.CustomerName).ToList(); // stable, new list
```

## See Also

- [linq-collection-choice](linq-collection-choice.md) - Structures with automatic ordering (SortedDictionary/SortedSet)
- [linq-deferred-execution-aware](linq-deferred-execution-aware.md) - Deferred execution fundamentals
