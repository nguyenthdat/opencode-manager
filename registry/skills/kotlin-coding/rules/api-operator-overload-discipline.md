# api-operator-overload-discipline

> Overload operators only when the semantics match built-in expectations

## Why It Matters

Operators carry strong implicit contracts: `+` should be associative-ish and side-effect-free, `==` should be a true equivalence relation, `[]` should behave like indexed access. Overloading an operator to mean something surprising (e.g., `+` that mutates, or `compareTo` that isn't consistent with `equals`) produces code that reads clearly but behaves unpredictably, which is worse than an explicitly named function.

## Bad

```kotlin
class ShoppingCart(private val items: MutableList<Item> = mutableListOf()) {
    // Surprising: `+` looks pure but mutates the receiver in place
    operator fun plus(item: Item): ShoppingCart {
        items.add(item)
        return this
    }
}

class Money(val cents: Long) : Comparable<Money> {
    // compareTo ignores currency but equals would consider it - inconsistent ordering
    override fun compareTo(other: Money): Int = cents.compareTo(other.cents)
}

// Using `[]` for something that isn't indexed access at all
class ConfigLoader {
    operator fun get(key: String): String = expensiveNetworkFetch(key) // hidden I/O!
}
```

## Good

```kotlin
class ShoppingCart(private val items: List<Item> = emptyList()) {
    // `+` returns a new, immutable cart - matches expectations for value-like plus
    operator fun plus(item: Item): ShoppingCart = ShoppingCart(items + item)
}

data class Money(val cents: Long, val currency: String) : Comparable<Money> {
    override fun compareTo(other: Money): Int {
        require(currency == other.currency) { "Cannot compare different currencies" }
        return cents.compareTo(other.cents)
    }
}

class ConfigLoader {
    // Explicit name signals this does I/O and can be slow/fail
    fun fetch(key: String): String = expensiveNetworkFetch(key)
}
```

## Operators Worth Overloading

```kotlin
data class Vector2(val x: Double, val y: Double) {
    operator fun plus(other: Vector2) = Vector2(x + other.x, y + other.y)
    operator fun times(scalar: Double) = Vector2(x * scalar, y * scalar)
    operator fun unaryMinus() = Vector2(-x, -y)
}

class Matrix(private val rows: Int, private val cols: Int, private val data: DoubleArray) {
    // [] for true indexed access is the textbook case for operator overloading
    operator fun get(row: Int, col: Int): Double = data[row * cols + col]
    operator fun set(row: Int, col: Int, value: Double) { data[row * cols + col] = value }
}
```

## Detekt Rule

`detekt` flags suspicious overloads with `ComparableWithAssignment` (mutating in `compareTo`) and general style rules; pair overloads with unit tests asserting the mathematical properties you're claiming (associativity, consistency with `equals`).

## See Also

- [`api-data-class-equality`](api-data-class-equality.md) - structural equality that `compareTo`/`equals` overloads must stay consistent with
- [`fn-immutable-collection-types`](fn-immutable-collection-types.md) - keep operator results immutable like `Vector2.plus` above
- [`anti-god-object`](anti-god-object.md) - avoid overloads like `[]` that hide expensive I/O
