# fn-immutable-collection-types

> Return `List`/`Set`/`Map`, not `MutableList`, from public APIs

## Why It Matters

Exposing a `MutableList` (or handing out the actual mutable instance behind a read-only-typed reference) lets any caller mutate internal state without the owning class knowing, breaking encapsulation and causing bugs that are hard to trace back to their source. Returning the read-only `List`/`Set`/`Map` interfaces makes the contract explicit: callers can read, but any mutation must go through an intentional API.

## Bad

```kotlin
class ShoppingCart {
    private val items = mutableListOf<Item>()

    fun getItems(): MutableList<Item> = items  // caller can mutate our private state directly!
}

val cart = ShoppingCart()
cart.getItems().clear()  // silently wipes the cart's internal state from outside
```

## Good

```kotlin
class ShoppingCart {
    private val items = mutableListOf<Item>()

    val itemsView: List<Item> get() = items  // read-only view, mutation must go through addItem/removeItem

    fun addItem(item: Item) { items.add(item) }
    fun removeItem(item: Item) { items.remove(item) }
}

val cart = ShoppingCart()
cart.itemsView.clear()  // compile error: List has no clear()
```

## Caveat: Read-Only Is a View, Not Deeply Immutable

```kotlin
class Repository {
    private val cache = mutableMapOf<String, Item>()

    val snapshot: Map<String, Item> get() = cache
    // WARNING: `snapshot` is still backed by the same mutable map -
    // if `cache` is mutated later, `snapshot` reflects that change too.
    // For a true frozen copy, return cache.toMap() instead:
    fun frozenSnapshot(): Map<String, Item> = cache.toMap()
}
```

## Defensive Copies at Boundaries

```kotlin
class ConfigStore(initial: List<String>) {
    // Copy on the way in too - don't trust that the caller won't mutate their own list later
    private val values: List<String> = initial.toList()

    fun values(): List<String> = values  // already immutable, safe to hand out directly
}
```

## See Also

- [`fn-val-over-var`](fn-val-over-var.md) - the reference-level analog of collection immutability
- [`anti-mutable-public-collections`](anti-mutable-public-collections.md) - the anti-pattern this rule prevents
- [`perf-immutable-collection-cost`](perf-immutable-collection-cost.md) - performance tradeoffs of defensive copies
- [`api-copy-with-defaults`](api-copy-with-defaults.md) - `copy()` shallow-copy caveat applies to mutable collection fields too
