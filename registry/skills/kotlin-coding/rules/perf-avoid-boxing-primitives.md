# perf-avoid-boxing-primitives

> Avoid boxing primitives in generic collections on hot paths

## Why It Matters

Generic collections like `List<Int>` box every element into an `Integer` object on the JVM, adding allocation, an extra pointer indirection, and GC pressure on every read and write. On hot paths — tight loops, per-frame rendering, high-frequency parsing — this boxing overhead can dominate runtime cost compared to using a primitive array.

## Bad

```kotlin
fun sumSquares(values: List<Int>): Long {
    var total = 0L
    for (v in values) { // each v unboxed from an Integer object on read
        total += v.toLong() * v.toLong()
    }
    return total
}

fun buildLargeList(n: Int): List<Int> {
    val list = mutableListOf<Int>()
    for (i in 0 until n) list.add(i) // n Integer boxes allocated
    return list
}
```

## Good

```kotlin
fun sumSquares(values: IntArray): Long {
    var total = 0L
    for (v in values) { // primitive int, no boxing
        total += v.toLong() * v.toLong()
    }
    return total
}

fun buildLargeArray(n: Int): IntArray {
    return IntArray(n) { i -> i } // backed by a raw int[], zero boxing
}
```

## Where Boxing Is Unavoidable

Standard generic types (`List<T>`, `Map<K, V>`) always box primitives on the JVM — that's fine for small collections or non-hot-path code where API ergonomics matter more than allocation. Reserve `IntArray`/`LongArray`/`DoubleArray` (or a library like Eclipse Collections' primitive collections) for large numeric buffers that are read or written in tight loops.

## Evidence

Android's performance guidance (developer.android.com/topic/performance) recommends primitive arrays over boxed `List<Integer>`/`List<Float>` in per-frame rendering and physics code specifically to avoid GC churn during animation.

## See Also

- [`perf-array-vs-list-primitives`](perf-array-vs-list-primitives.md) - choosing arrays over lists for numeric hot-path data
- [`perf-collection-chain-cost`](perf-collection-chain-cost.md) - related allocation cost in collection pipelines
- [`perf-sequence-large-collections`](perf-sequence-large-collections.md) - reducing intermediate allocations at scale
- [`type-value-class-wrapper`](type-value-class-wrapper.md) - value classes can wrap primitives without boxing in many contexts
