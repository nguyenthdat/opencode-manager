# perf-collection-chain-cost

> Be aware that each chained collection operator allocates an intermediate list

## Why It Matters

`map`, `filter`, `sorted`, and similar operators on `List`/`Iterable` are eager — each one immediately produces a brand-new list. Chaining several operators allocates one intermediate collection per step, so on large datasets this multiplies memory traffic and GC pressure compared to a single pass or a lazily-evaluated `Sequence`.

## Bad

```kotlin
fun activeUserNames(users: List<User>): List<String> {
    return users
        .filter { it.isActive }      // allocates list #1
        .map { it.name }              // allocates list #2
        .filter { it.isNotBlank() }   // allocates list #3
        .sorted()                     // allocates list #4
}
```

## Good

```kotlin
fun activeUserNames(users: List<User>): List<String> {
    return users.asSequence()
        .filter { it.isActive }
        .map { it.name }
        .filter { it.isNotBlank() }
        .sorted()
        .toList() // single terminal allocation
}

// Or a single manual pass for maximum control:
fun activeUserNamesManual(users: List<User>): List<String> {
    val result = mutableListOf<String>()
    for (user in users) {
        if (user.isActive && user.name.isNotBlank()) result += user.name
    }
    return result.sorted()
}
```

## When Eager Chains Are Fine

For small collections (tens to low hundreds of elements), eager `List` operators are simpler to read and the allocation cost is negligible. Reserve `Sequence` or manual loops for collections in the thousands+ that are processed repeatedly or on a hot path.

## See Also

- [`perf-sequence-large-collections`](perf-sequence-large-collections.md) - switching to `Sequence` for large pipelines
- [`fn-collection-vs-sequence-tradeoff`](fn-collection-vs-sequence-tradeoff.md) - deciding between eager and lazy collections
- [`fn-collection-operator-chaining`](fn-collection-operator-chaining.md) - readability guidance for chained operators
- [`perf-immutable-collection-cost`](perf-immutable-collection-cost.md) - related copy costs from immutable-style updates
