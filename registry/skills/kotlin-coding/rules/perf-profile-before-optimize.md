# perf-profile-before-optimize

> Profile before optimizing; don't guess at hot paths

## Why It Matters

Intuition about which code is slow is frequently wrong — engineers commonly "optimize" cold code paths while the real bottleneck (a serialization step, a lock, an N+1 query) goes untouched, wasting effort and adding complexity for zero measured benefit.

## Bad

```kotlin
// "I bet this loop is the bottleneck" - no measurement, just rewritten to look "faster"
fun processOrders(orders: List<Order>): List<Receipt> {
    val result = ArrayList<Receipt>(orders.size) // premature capacity tuning
    var i = 0
    while (i < orders.size) { // manual index loop instead of for-each, no evidence this helped
        result.add(toReceipt(orders[i]))
        i++
    }
    return result
}
```

## Good

```kotlin
// Measure first with JMH, Android Studio Profiler, or kotlinx-benchmark
fun processOrders(orders: List<Order>): List<Receipt> =
    orders.map { toReceipt(it) } // clear, idiomatic - proven fast enough by profiling

// Example JMH benchmark used to justify a real optimization:
// @Benchmark
// fun benchmarkProcessOrders(state: OrderState): List<Receipt> = processOrders(state.orders)
```

## A Practical Workflow

1. Reproduce the performance complaint with a realistic benchmark or trace (Android Studio Profiler, `perf`, JMH, `kotlinx-benchmark`).
2. Identify the actual hot function or allocation via a flame graph or allocation tracker.
3. Apply a targeted fix (see `perf-collection-chain-cost`, `perf-avoid-boxing-primitives`, etc.).
4. Re-measure to confirm the fix actually helped before merging.

## See Also

- [`perf-collection-chain-cost`](perf-collection-chain-cost.md) - a common, measurable allocation hotspot
- [`perf-coroutine-dispatcher-overhead`](perf-coroutine-dispatcher-overhead.md) - another cost worth measuring, not guessing
- [`perf-avoid-reflection-hot-path`](perf-avoid-reflection-hot-path.md) - reflection overhead is easy to over- or under-estimate
