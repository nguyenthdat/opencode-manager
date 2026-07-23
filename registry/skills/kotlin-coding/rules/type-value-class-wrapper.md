# type-value-class-wrapper

> Use `value class` to wrap a primitive with zero runtime overhead

## Why It Matters

Passing raw `String` or `Int` for concepts like `UserId`, `Email`, or `Cents` lets you accidentally swap two arguments of the same underlying type with no compiler complaint. A `value class` (`inline class` before Kotlin 1.5) gives you a distinct, type-safe wrapper that the compiler erases to the underlying primitive at compile time in most cases, so you get type safety without allocation or boxing overhead in the common path.

## Bad

```kotlin
fun createOrder(userId: String, productId: String) { /* ... */ }

// Compiles fine, but arguments are swapped - a silent bug
createOrder(userId = productSku, productId = currentUserId)

fun applyDiscount(amountCents: Int, percentOff: Int): Int {
    return amountCents - (amountCents * percentOff / 100)
}

// Compiles fine, but arguments are swapped here too
applyDiscount(amountCents = 15, percentOff = 500)
```

## Good

```kotlin
@JvmInline
value class UserId(val value: String)

@JvmInline
value class ProductId(val value: String)

fun createOrder(userId: UserId, productId: ProductId) { /* ... */ }

// Now a swap is a compile error, not a runtime bug
createOrder(userId = UserId(currentUserId), productId = ProductId(productSku))

@JvmInline
value class Cents(val amount: Int) {
    operator fun minus(other: Cents) = Cents(amount - other.amount)
}

@JvmInline
value class Percent(val value: Int)

fun applyDiscount(price: Cents, off: Percent): Cents =
    Cents(price.amount - (price.amount * off.value / 100))
```

## Constraints And Boxing

A value class can only wrap a single property, cannot itself have subclasses (though it can implement interfaces), and gets boxed by the JVM whenever it's used as a generic type argument, stored in a nullable position, or seen through a supertype — so it isn't free in every context, only in the direct, unboxed case.

```kotlin
@JvmInline
value class Age(val years: Int)

fun printAge(age: Age) = println(age.years)      // Unboxed - just an Int at runtime
val ages: List<Age> = listOf(Age(30), Age(40))   // Boxed - generics require an object
val maybeAge: Age? = null                         // Boxed - nullable value classes box
```

## See Also

- [`type-data-class-value`](type-data-class-value.md) - use when wrapping more than one property
- [`perf-avoid-boxing-primitives`](perf-avoid-boxing-primitives.md) - explains when value classes still box
- [`anti-primitive-obsession`](anti-primitive-obsession.md) - the anti-pattern value classes address
- [`interop-jvmname-clash`](interop-jvmname-clash.md) - `@JvmInline` interacts with JVM overload resolution
