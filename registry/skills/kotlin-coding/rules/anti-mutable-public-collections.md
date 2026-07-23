# anti-mutable-public-collections

> Don't expose `MutableList`/`MutableMap` from a class's public API

## Why It Matters

Returning a `MutableList` (or exposing a `var` of one) from a class's public API lets any caller mutate the class's internal state without going through its methods, breaking encapsulation and any invariants the class was supposed to maintain — and it happens silently, since the compiler sees nothing wrong with mutating a list you were handed.

## Bad

```kotlin
class ShoppingCart {
    val items: MutableList<Item> = mutableListOf() // exposed as mutable

    fun total(): Money = items.sumOf { it.price }
}

val cart = ShoppingCart()
cart.items.add(Item("Widget", Money(999))) // bypasses any validation ShoppingCart might want
cart.items.clear() // nothing stops external code from wiping internal state
```

## Good

```kotlin
class ShoppingCart {
    private val _items: MutableList<Item> = mutableListOf()
    val items: List<Item> get() = _items // read-only view exposed publicly

    fun addItem(item: Item) {
        require(item.price.cents >= 0) { "price cannot be negative" }
        _items.add(item) // all mutation goes through validated methods
    }

    fun total(): Money = _items.sumOf { it.price }
}

val cart = ShoppingCart()
cart.addItem(Item("Widget", Money(999)))
// cart.items.add(...) // doesn't compile - items is List, not MutableList
```

## When It's Still Sometimes Seen

A `MutableList` returned from an internal, module-private helper that both sides genuinely intend to co-mutate (a builder handing off its buffer to a single known caller) is a narrower, deliberate case — but even then, prefer returning an immutable snapshot (`toList()`) unless the shared mutation is the actual intent.

```kotlin
internal fun MutableList<Item>.applyDiscounts(): MutableList<Item> = this.also { /* ... */ }
// internal, single caller, mutation is the explicit contract - acceptable
```

## See Also

- [`fn-immutable-collection-types`](fn-immutable-collection-types.md) - the positive-framed rule for preferring read-only collection types
- [`name-backing-property-underscore`](name-backing-property-underscore.md) - the `_items`/`items` naming convention used above
- [`api-visibility-internal`](api-visibility-internal.md) - the general visibility discipline this rule is a specific case of
