# perf-sequence-large-collections

> Switch to `Sequence` once collection pipelines process large data

## Why It Matters

`Sequence` evaluates operators lazily, element by element, so a chain of `map`/`filter` over a large dataset performs a single pass without materializing an intermediate list at every step — unlike eager `List` operators, which allocate one new list per operator.

## Bad

```kotlin
fun firstTenEvenSquares(numbers: List<Long>): List<Long> {
    return numbers
        .map { it * it }         // maps ALL elements eagerly
        .filter { it % 2 == 0L } // filters the full mapped list
        .take(10)                 // even though only 10 are needed
}
```

## Good

```kotlin
fun firstTenEvenSquares(numbers: List<Long>): List<Long> {
    return numbers.asSequence()
        .map { it * it }          // lazy, evaluated on demand
        .filter { it % 2 == 0L }
        .take(10)                  // short-circuits after 10 matches
        .toList()
}
```

## When Sequence Adds Overhead

For small collections, wrapping in `asSequence()` adds iterator and lambda-object overhead that can outweigh the savings versus eager `List` operators. `Sequence` pays off once the collection is large or the pipeline can short-circuit (`take`, `first`, `find`).

## See Also

- [`perf-collection-chain-cost`](perf-collection-chain-cost.md) - the intermediate-allocation problem `Sequence` solves
- [`fn-collection-vs-sequence-tradeoff`](fn-collection-vs-sequence-tradeoff.md) - deeper guidance on choosing between the two
- [`fn-sequence-for-laziness`](fn-sequence-for-laziness.md) - laziness beyond just performance
- [`perf-immutable-collection-cost`](perf-immutable-collection-cost.md) - related collection-representation cost
