# fn-collection-operator-chaining

> Chain collection operators for readability, but watch for redundant passes over large data

## Why It Matters

Chaining `filter`/`map`/`sortedBy` reads like a pipeline of clear, declarative steps and is usually easier to review than an equivalent hand-written loop. But each operator on a `List` does a full pass and allocates a new list, so a long chain over a large collection can multiply both time and garbage-collector pressure - readability and performance pull in different directions and the right balance depends on collection size and hot-path status.

## Bad

```kotlin
// Six passes and five intermediate list allocations over what could be one pass
fun topSpenders(orders: List<Order>): List<String> =
    orders
        .filter { it.amount > 0 }
        .map { it.customerId to it.amount }
        .groupBy({ it.first }, { it.second })
        .mapValues { (_, amounts) -> amounts.sum() }
        .toList()
        .sortedByDescending { it.second }
        .take(10)
        .map { it.first }
// Fine for 50 orders; potentially expensive if `orders` has millions of rows and this runs per-request
```

## Good

```kotlin
// Same logic, but combine steps where redundant intermediate lists add no value
fun topSpenders(orders: List<Order>): List<String> =
    orders
        .asSequence()                                   // avoid 5 intermediate list allocations
        .filter { it.amount > 0 }
        .groupBy({ it.customerId }, { it.amount })
        .mapValues { (_, amounts) -> amounts.sum() }
        .entries
        .sortedByDescending { it.value }
        .take(10)
        .map { it.key }
        .toList()
```

## When to Just Keep the Chain As-Is

```kotlin
// Small, bounded collections (config lists, UI items, a page of results) -
// clarity wins outright, and asSequence()/manual loops would only add noise.
fun visibleMenuItems(items: List<MenuItem>): List<String> =
    items.filter { it.isVisible }.sortedBy { it.order }.map { it.label }
```

## Detekt Rule

`detekt`'s `complexity` rule set includes checks like `NestedBlockDepth` and general chain-length heuristics; some teams add a custom rule flagging chains longer than 4-5 operators over collections not already behind an explicit size/perf review, prompting a second look rather than blocking outright.

## See Also

- [`fn-sequence-for-laziness`](fn-sequence-for-laziness.md) - the primary fix for redundant intermediate allocations
- [`perf-collection-chain-cost`](perf-collection-chain-cost.md) - deeper look at the actual allocation/pass cost
- [`perf-profile-before-optimize`](perf-profile-before-optimize.md) - confirm the chain is actually a bottleneck before rewriting it
