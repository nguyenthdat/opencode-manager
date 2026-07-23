# anti-var-for-immutable-state

> Don't use `var` and manual reassignment where an immutable `val` update expresses intent better

## Why It Matters

A `var` can be reassigned from anywhere in its scope at any time, so understanding its value at a given line requires scanning every prior statement that might have touched it — and in a class, every method. Modeling state as an immutable `val` that gets replaced wholesale (via `copy()` or a new expression) makes each state transition an explicit, traceable event instead of an implicit mutation buried in a method body.

## Bad

```kotlin
class OrderBuilder {
    var id: String = ""
    var items: MutableList<Item> = mutableListOf()
    var discount: Double = 0.0

    fun applyDiscount(pct: Double) {
        discount = pct // mutated in place - order of calls now matters silently
    }

    fun addItem(item: Item) {
        items.add(item) // mutated in place
    }
}

fun computeTotal(order: Order): Long {
    var total = 0L
    for (item in order.items) {
        total += item.price.cents // manual accumulation, easy to get wrong
    }
    return total
}
```

## Good

```kotlin
data class Order(
    val id: String,
    val items: List<Item> = emptyList(),
    val discount: Double = 0.0,
)

fun Order.withDiscount(pct: Double): Order = copy(discount = pct) // new value, old one untouched
fun Order.withItem(item: Item): Order = copy(items = items + item)

fun computeTotal(order: Order): Long =
    order.items.sumOf { it.price.cents } // expresses the "what", not the "how"
```

## When `var` Is Still the Right Tool

```kotlin
// Local, tight-scope accumulation where a functional fold would be
// less readable, or genuine mutable performance-sensitive state
fun parseTokens(input: String): List<Token> {
    var index = 0 // local var, small scope, clearly the right tool here
    val tokens = mutableListOf<Token>()
    while (index < input.length) {
        val (token, next) = readToken(input, index)
        tokens += token
        index = next
    }
    return tokens
}
```

`var` is fine for local, small-scope mutable bookkeeping; the anti-pattern is specifically using it to represent an object's *domain state* across a wider scope where an immutable replacement would communicate intent better.

## See Also

- [`fn-val-over-var`](fn-val-over-var.md) - the positive-framed rule this anti-pattern violates
- [`api-copy-with-defaults`](api-copy-with-defaults.md) - the `copy()` mechanism used to produce new immutable states
- [`type-data-class-value`](type-data-class-value.md) - model state as an immutable data class in the first place
