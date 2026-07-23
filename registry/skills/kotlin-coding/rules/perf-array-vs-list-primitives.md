# perf-array-vs-list-primitives

> Use primitive arrays (`IntArray`, etc.) for large numeric hot-path data

## Why It Matters

`IntArray`, `LongArray`, `DoubleArray`, and friends compile to raw JVM primitive arrays (`int[]`, `long[]`, ...), avoiding the per-element boxing that `List<Int>` or `Array<Int>` incur. For large numeric buffers — audio samples, matrices, sensor data — this cuts memory footprint roughly fourfold and removes boxing allocation and GC overhead entirely.

## Bad

```kotlin
fun computeMatrix(rows: Int, cols: Int): List<List<Double>> {
    return List(rows) { r -> List(cols) { c -> (r * cols + c).toDouble() } } // boxed Double per cell
}

fun sumAll(matrix: List<List<Double>>): Double =
    matrix.sumOf { row -> row.sum() } // repeated unboxing on every read
```

## Good

```kotlin
fun computeMatrix(rows: Int, cols: Int): Array<DoubleArray> {
    return Array(rows) { r -> DoubleArray(cols) { c -> (r * cols + c).toDouble() } } // raw double[][]
}

fun sumAll(matrix: Array<DoubleArray>): Double {
    var total = 0.0
    for (row in matrix) {
        for (value in row) total += value // no boxing
    }
    return total
}
```

## Trade-offs

Primitive arrays lack the rich stdlib extension surface that `List` has (no built-in structural immutability, fewer functional operators without `asIterable()`/`asList()` wrapping) and are always mutable and reference-shared. Reach for them only where profiling shows boxed collections are the bottleneck; otherwise prefer `List<T>` for API clarity and safety.

## See Also

- [`perf-avoid-boxing-primitives`](perf-avoid-boxing-primitives.md) - the boxing cost these arrays avoid
- [`perf-immutable-collection-cost`](perf-immutable-collection-cost.md) - related collection-representation trade-offs
- [`perf-profile-before-optimize`](perf-profile-before-optimize.md) - confirm the numeric path is actually hot first
