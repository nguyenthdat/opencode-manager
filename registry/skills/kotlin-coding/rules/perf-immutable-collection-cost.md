# perf-immutable-collection-cost

> Understand persistent/immutable collection copy costs versus mutable builders

## Why It Matters

Kotlin's read-only `List`/`Map` interfaces are usually just views over a plain mutable `ArrayList`/`LinkedHashMap`, so "immutable-looking" operations like `+` create a full copy of the collection every time they're called. Using this pattern inside a loop turns an intended O(n) build into O(n^2) copying; builders or true persistent structures avoid the repeated copies.

## Bad

```kotlin
fun buildIds(count: Int): List<Int> {
    var ids: List<Int> = emptyList()
    for (i in 0 until count) {
        ids = ids + i // copies the entire growing list every iteration - O(n^2)
    }
    return ids
}
```

## Good

```kotlin
fun buildIds(count: Int): List<Int> = buildList {
    for (i in 0 until count) add(i) // single growable backing array, O(n)
}

// True persistent structure when you need structural sharing across versions:
import kotlinx.collections.immutable.persistentListOf

fun buildVersionedIds(count: Int) {
    var ids = persistentListOf<Int>()
    for (i in 0 until count) {
        ids = ids.add(i) // O(log n) structural sharing, not a full copy
    }
}
```

## Standard Read-Only vs Persistent

Kotlin stdlib `List` is read-only, not immutable — the underlying object can still be mutated through another reference, and `+`/`-` always copy. Reach for `kotlinx.collections.immutable`'s `PersistentList`/`PersistentMap` when you need real immutability with efficient incremental updates (undo stacks, state shared across coroutines).

## See Also

- [`perf-collection-chain-cost`](perf-collection-chain-cost.md) - related allocation cost from chained operators
- [`fn-immutable-collection-types`](fn-immutable-collection-types.md) - general guidance on immutable collection types
- [`flow-stateflow-ui-state`](flow-stateflow-ui-state.md) - a common place immutable collections get rebuilt per update
