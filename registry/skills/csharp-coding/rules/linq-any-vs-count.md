# linq-any-vs-count

> Use `.Any()` instead of `.Count() > 0` to check for emptiness

## Why It Matters

`.Count()` on an `IEnumerable<T>` (without a known `Count`/`Length`, like a raw query or `Where(...)` result) must enumerate the *entire* sequence to produce a count. `.Any()` short-circuits after finding the first matching element - for a large or expensive-to-enumerate sequence, this is the difference between checking one element and checking all of them.

## Bad

```csharp
var hasErrors = logEntries.Where(e => e.Level == LogLevel.Error).Count() > 0;
// Enumerates every single log entry just to answer a yes/no question

if (orders.Count() == 0)
{
    ShowEmptyState();
}
```

## Good

```csharp
var hasErrors = logEntries.Any(e => e.Level == LogLevel.Error);
// Stops at the first matching entry

if (!orders.Any())
{
    ShowEmptyState();
}
```

## Exception: Types With an O(1) Count

```csharp
// List<T>, T[], ICollection<T>, and similar already expose Count/Length as O(1)
// properties - LINQ's Count() extension method special-cases these and does NOT
// re-enumerate, so either form is fine performance-wise. Any() is still preferred
// for readability ("is there at least one" reads more directly than "count > 0").
List<Order> orders = GetOrders();
if (orders.Count > 0) { /* fine - Count is a fast property here, not LINQ's Count() */ }
if (orders.Any()) { /* also fine, arguably clearer intent */ }
```

## Combining With a Predicate

```csharp
// Any(predicate) is both clearer and faster than Where(predicate).Count() > 0 -
// it avoids constructing an intermediate filtered sequence entirely.
bool hasExpensiveOrder = orders.Any(o => o.Total > 10_000m);
```

## See Also

- [linq-firstordefault-vs-first](linq-firstordefault-vs-first.md) - Similar short-circuiting operator choice
- [linq-deferred-execution-aware](linq-deferred-execution-aware.md) - Why this matters for lazy sequences
