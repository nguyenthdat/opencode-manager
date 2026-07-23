# fn-function-composition

> Compose small functions instead of one large branching function

## Why It Matters

A single function that branches through every case of a pipeline (validate, then transform, then persist, each with its own conditionals) becomes hard to test in isolation and hard to reuse partially. Composing small, single-purpose functions - each independently testable - and combining them with `andThen`-style chaining or simple sequential calls keeps each piece simple while the composition itself stays declarative.

## Bad

```kotlin
fun processOrder(raw: String): Order {
    val trimmed = raw.trim()
    if (trimmed.isEmpty()) throw IllegalArgumentException("empty order")
    val parts = trimmed.split(",")
    if (parts.size != 3) throw IllegalArgumentException("malformed order")
    val (id, itemsRaw, customerRaw) = parts
    val items = itemsRaw.split(";").map { it.trim() }
    val customer = customerRaw.trim().uppercase()
    val order = Order(id, items, customer)
    if (order.items.isEmpty()) throw IllegalArgumentException("no items")
    return order
    // One long function doing parsing, validation, and construction inline -
    // none of these steps can be tested or reused independently.
}
```

## Good

```kotlin
fun parseOrderLine(raw: String): List<String> =
    raw.trim().split(",").also { require(it.size == 3) { "malformed order" } }

fun toOrder(parts: List<String>): Order {
    val (id, itemsRaw, customerRaw) = parts
    return Order(id, itemsRaw.split(";").map(String::trim), customerRaw.trim().uppercase())
}

fun validateOrder(order: Order): Order =
    order.also { require(it.items.isNotEmpty()) { "no items" } }

fun processOrder(raw: String): Order =
    parseOrderLine(raw)
        .let(::toOrder)
        .let(::validateOrder)
// Each step is independently unit-testable and reusable in other pipelines
```

## Manual Function Composition Helper

```kotlin
infix fun <A, B, C> ((A) -> B).then(next: (B) -> C): (A) -> C = { a -> next(this(a)) }

val pipeline: (String) -> Order = ::parseOrderLine then ::toOrder then ::validateOrder
val order = pipeline(rawInput)
```

## See Also

- [`fn-higher-order-functions`](fn-higher-order-functions.md) - functions as composable values
- [`anti-deep-nesting-when`](anti-deep-nesting-when.md) - the branching-function anti-pattern this rule helps avoid
- [`err-arrow-either-modeling`](err-arrow-either-modeling.md) - composing fallible steps with `Either` in Arrow
