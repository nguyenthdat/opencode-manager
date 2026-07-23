# anti-primitive-obsession

> Don't pass raw primitives where a domain type/value class belongs

## Why It Matters

A function signature like `fun charge(amount: Long, userId: String, currency: String)` lets a caller pass any `Long` and any `String` in any order and the compiler will happily accept it, even if `amount` is actually cents in the wrong currency or `userId` and `currency` got swapped. Wrapping primitives in domain-specific types moves that class of bug from "found in production" to "doesn't compile."

## Bad

```kotlin
fun charge(amount: Long, userId: String, currency: String): Receipt = /* ... */ error("unimplemented")

// Compiles fine, but the amount is actually dollars not cents, and the
// order of the two Strings has been silently swapped
charge(amount = 4200, userId = "USD", currency = "user-123")

fun withinRange(value: Double, min: Double, max: Double): Boolean =
    value in min..max
// Nothing stops calling withinRange(temperature, maxLatitude, minLongitude)
```

## Good

```kotlin
@JvmInline value class Cents(val value: Long)
@JvmInline value class UserId(val value: String)
enum class Currency { USD, EUR, GBP }

data class Money(val amount: Cents, val currency: Currency)

fun charge(amount: Money, userId: UserId): Receipt = /* ... */ error("unimplemented")

// Swapping arguments, or passing a raw Long/String, is now a compile error
charge(amount = Money(Cents(4200), Currency.USD), userId = UserId("user-123"))
```

## When It's Still Sometimes Seen

Purely local, throwaway computations with no domain meaning attached don't need wrapping — a loop counter or an array index is genuinely "just an Int," not a domain concept:

```kotlin
for (i in 0 until items.size) { /* ... */ } // no value class needed for `i`
```

The line is whether the primitive represents a *domain concept with rules* (money, an ID, a bounded range) versus a *purely structural* value (an index, a count in a tight loop).

## See Also

- [`anti-stringly-typed-data`](anti-stringly-typed-data.md) - the string-specific version of this same problem
- [`type-value-class-wrapper`](type-value-class-wrapper.md) - the positive-framed rule for wrapping primitives at zero runtime cost
- [`api-named-arguments-clarity`](api-named-arguments-clarity.md) - a partial mitigation when full wrapping isn't yet done
