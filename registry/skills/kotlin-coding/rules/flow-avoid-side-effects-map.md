# flow-avoid-side-effects-map

> Avoid side effects inside `map`/`transform`; use `onEach` for them instead

## Why It Matters

`map` and `transform` communicate "pure transformation" to readers, so hiding logging, mutation of external state, or UI updates inside them makes code misleading and hard to reorder safely — moving a `map` for refactoring shouldn't also move a side effect that other code depends on running at a particular point. `onEach` exists specifically to make side effects visible and separate from data transformation in the chain.

## Bad

```kotlin
fun processOrders(orders: Flow<Order>): Flow<ProcessedOrder> =
    orders.map { order ->
        log.info("Processing order ${order.id}") // BAD: side effect hidden inside map
        metrics.increment("orders.processed")     // BAD: another hidden side effect
        ProcessedOrder(order.id, order.total * 1.1)
    }
```

## Good

```kotlin
fun processOrders(orders: Flow<Order>): Flow<ProcessedOrder> =
    orders
        .onEach { order ->
            log.info("Processing order ${order.id}")
            metrics.increment("orders.processed")
        }
        .map { order -> ProcessedOrder(order.id, order.total * 1.1) }
```

## Why This Matters Beyond Style

Flow operators can be skipped, reordered by refactoring tools, or short-circuited by upstream cancellation (e.g. `flatMapLatest`, `take`). A side effect buried in `map` runs (or doesn't run) exactly as many times as `map` is invoked, which is an implementation detail — `onEach` at least makes it obvious to the next reader that this step exists purely to observe, not to transform.

```kotlin
// take(3) may cancel the upstream mid-flight; a hidden side effect in map could
// run a variable number of times depending on cancellation timing - onEach makes
// this explicit and easy to reason about even if the exact count still varies
orders
    .onEach { analytics.log(it) }
    .take(3)
    .collect { render(it) }
```

## Detekt Rule

Detekt's `SpacingBetweenPackageAndImports`-style rules don't cover this directly, but a custom rule or code review checklist item enforcing "no non-pure lambdas in map/transform" catches it; some teams enforce it via `TransformerToOnEach` in a custom detekt rule set.

## See Also

- [`flow-catch-operator`](flow-catch-operator.md) - catch has the same "upstream only" placement discipline
- [`fn-higher-order-functions`](fn-higher-order-functions.md) - keeping lambdas pure generally
- [`doc-inline-why-not-what`](doc-inline-why-not-what.md) - documenting why a side effect exists if it must stay
