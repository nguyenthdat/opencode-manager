# fn-higher-order-functions

> Pass behavior as a higher-order function instead of a strategy class

## Why It Matters

The classic Strategy pattern in Java requires an interface, one implementation class per behavior, and boilerplate wiring to select and inject the right one. Kotlin functions are first-class values, so a `(T) -> R` parameter accomplishes the same polymorphism without any of the ceremony - callers just pass a lambda, method reference, or function value directly.

## Bad

```kotlin
interface DiscountStrategy {
    fun apply(price: Double): Double
}

class PercentageDiscount(private val percent: Double) : DiscountStrategy {
    override fun apply(price: Double): Double = price * (1 - percent / 100)
}

class FlatDiscount(private val amount: Double) : DiscountStrategy {
    override fun apply(price: Double): Double = (price - amount).coerceAtLeast(0.0)
}

class Checkout(private val strategy: DiscountStrategy) {
    fun total(price: Double): Double = strategy.apply(price)
}

Checkout(PercentageDiscount(10.0)).total(100.0)
```

## Good

```kotlin
class Checkout(private val discount: (Double) -> Double) {
    fun total(price: Double): Double = discount(price)
}

Checkout(discount = { price -> price * 0.9 }).total(100.0)
Checkout(discount = { price -> (price - 5.0).coerceAtLeast(0.0) }).total(100.0)

// Reusable named strategies are just functions, no classes required
fun percentageDiscount(percent: Double): (Double) -> Double = { it * (1 - percent / 100) }
Checkout(discount = percentageDiscount(10.0)).total(100.0)
```

## Composing Behavior with Higher-Order Functions

```kotlin
fun retry(times: Int, block: () -> Boolean): Boolean {
    repeat(times) { if (block()) return true }
    return false
}

fun <T, R> memoize(fn: (T) -> R): (T) -> R {
    val cache = mutableMapOf<T, R>()
    return { input -> cache.getOrPut(input) { fn(input) } }
}

val slowSquare = memoize<Int, Int> { it * it }
```

## When a Class Is Still Better

```kotlin
// Behavior that needs multiple related methods, mutable internal state,
// or a name meaningful in stack traces/DI graphs is still better as a class.
interface PaymentGateway {
    fun charge(amount: Double): Result<Receipt>
    fun refund(receiptId: String): Result<Unit>
}
```

## See Also

- [`fn-function-composition`](fn-function-composition.md) - composing small functions built on this same idea
- [`api-dsl-lambda-receiver`](api-dsl-lambda-receiver.md) - lambda parameters as the basis for DSLs
- [`test-fake-over-mock`](test-fake-over-mock.md) - lambdas make substituting test behavior trivial without mocking frameworks
