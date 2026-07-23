# anti-excessive-nullable-types

> Don't reach for nullable types instead of modeling absence properly

## Why It Matters

Making every field `T?` "just in case" turns simple data access into a maze of `?.`/`!!`/`?:` at every call site and hides the real question — *why* is this absent, and under what states is it guaranteed present? Sealed classes, default values, and separate types for separate states almost always express the domain more precisely than a nullable field that's actually "present, but only after step 3."

## Bad

```kotlin
data class Order(
    val id: String,
    val items: List<Item>,
    val shippingAddress: Address?,   // null before shipping step, non-null after
    val trackingNumber: String?,     // null until shipped
    val deliveredAt: Instant?,       // null until delivered
    val cancelReason: String?,       // null unless cancelled
)

fun printLabel(order: Order) {
    // Every caller has to guess which nulls are "expected" here
    val address = order.shippingAddress ?: error("no address")
    val tracking = order.trackingNumber ?: error("not shipped yet")
    println("$tracking -> $address")
}
```

## Good

```kotlin
sealed interface Order {
    val id: String
    val items: List<Item>

    data class Pending(override val id: String, override val items: List<Item>) : Order

    data class Shipped(
        override val id: String,
        override val items: List<Item>,
        val shippingAddress: Address, // guaranteed non-null in this state
        val trackingNumber: String,
    ) : Order

    data class Delivered(
        override val id: String,
        override val items: List<Item>,
        val trackingNumber: String,
        val deliveredAt: Instant,
    ) : Order

    data class Cancelled(
        override val id: String,
        override val items: List<Item>,
        val reason: String,
    ) : Order
}

fun printLabel(order: Order.Shipped) {
    // No nullability, no guessing - the type guarantees these fields exist
    println("${order.trackingNumber} -> ${order.shippingAddress}")
}
```

## When It's Still Sometimes Seen

```kotlin
// A genuinely optional, single piece of data with no associated state
// machine - a nullable field is the right, simple choice here
data class UserProfile(val name: String, val bio: String?)
```

## See Also

- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - the positive-framed rule this anti-pattern violates
- [`type-sealed-when-exhaustive`](type-sealed-when-exhaustive.md) - forces every state to be handled once modeled this way
- [`anti-not-null-assert-abuse`](anti-not-null-assert-abuse.md) - the usual symptom of excessive nullability at call sites
