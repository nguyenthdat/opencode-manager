# fn-sequence-for-laziness

> Use `Sequence` for long, chained collection pipelines needing laziness

## Why It Matters

Each `List` operator (`map`, `filter`, etc.) eagerly allocates a full new intermediate list, so a chain of five operators over a large collection allocates five intermediate lists and does five full passes. `Sequence` evaluates lazily, element-by-element, through the whole chain, so intermediate allocations disappear and short-circuiting operators like `first`/`take` can stop early without processing the entire source.

## Bad

```kotlin
fun findFirstValidOrder(orders: List<Order>): Order? =
    orders
        .map { it.normalize() }        // allocates a full intermediate List
        .filter { it.isValid() }       // allocates another full intermediate List
        .map { it.applyDiscount() }    // and another
        .firstOrNull()
// Even though we only need the FIRST valid order, every order is normalized,
// filtered, and discounted before firstOrNull() picks one.
```

## Good

```kotlin
fun findFirstValidOrder(orders: List<Order>): Order? =
    orders
        .asSequence()
        .map { it.normalize() }
        .filter { it.isValid() }
        .map { it.applyDiscount() }
        .firstOrNull()
// Lazy: normalize/filter/discount run one order at a time, and processing
// stops as soon as firstOrNull() finds a match - no wasted work downstream.
```

## Large Pipelines Benefit Even Without Short-Circuiting

```kotlin
fun summarize(transactions: List<Transaction>): Report {
    return transactions
        .asSequence()
        .filter { it.amount > 0 }
        .map { it.toLineItem() }
        .groupBy { it.category }
        .mapValues { (_, items) -> items.sumOf { it.amount } }
        .let { totals -> Report(totals) }
    // Still only one pass per element through the lazy chain, versus one
    // fully-materialized list per operator with eager List operations.
}
```

## Evidence

kotlinx.coroutines' `Flow` documentation explicitly compares `Flow` to `Sequence` as the "cold, lazy" collection abstraction; the Kotlin standard library docs for `Iterable.asSequence()` recommend it specifically "when there are multiple steps" - a single `filter` or `map` call doesn't need it.

## See Also

- [`fn-collection-vs-sequence-tradeoff`](fn-collection-vs-sequence-tradeoff.md) - when eager `List` is actually faster
- [`perf-sequence-large-collections`](perf-sequence-large-collections.md) - performance characteristics in more depth
- [`flow-cold-vs-hot`](flow-cold-vs-hot.md) - the async analog of sequence laziness
