# type-sealed-class-hierarchy

> Model closed hierarchies with `sealed class`/`sealed interface`

## Why It Matters

An open hierarchy (a plain `abstract class` or `interface`) can be subclassed anywhere, so the compiler can never guarantee it has seen every case. A `sealed` hierarchy restricts subtypes to the same compilation unit (module + package in modern Kotlin), which lets `when` expressions be exhaustive and lets refactors surface every call site that needs updating when a new variant is added.

## Bad

```kotlin
// Open hierarchy: anyone anywhere can add a new subclass
abstract class PaymentResult

class Success(val transactionId: String) : PaymentResult()
class Failure(val reason: String) : PaymentResult()

fun handle(result: PaymentResult) {
    when (result) {
        is Success -> println("OK: ${result.transactionId}")
        is Failure -> println("Failed: ${result.reason}")
        else -> println("Unknown result")  // Dead code that hides gaps
    }
}
```

## Good

```kotlin
sealed interface PaymentResult {
    data class Success(val transactionId: String) : PaymentResult
    data class Failure(val reason: String) : PaymentResult
    data object Pending : PaymentResult
}

fun handle(result: PaymentResult) {
    when (result) {
        is PaymentResult.Success -> println("OK: ${result.transactionId}")
        is PaymentResult.Failure -> println("Failed: ${result.reason}")
        PaymentResult.Pending -> println("Waiting...")
        // No `else` needed - compiler proves this when is exhaustive
    }
}
```

## Sealed Class vs Sealed Interface

```kotlin
// sealed class: use when variants share state or behavior
sealed class Shape(val area: Double)
class Circle(radius: Double) : Shape(Math.PI * radius * radius)
class Square(side: Double) : Shape(side * side)

// sealed interface: use when variants have no shared state,
// or a variant needs to implement multiple sealed hierarchies
sealed interface UiEvent
sealed interface Loggable

data class Click(val x: Int, val y: Int) : UiEvent, Loggable
```

## Evidence

Arrow's `Either<L, R>` and ktor's `HttpStatusCode`-adjacent result modeling both lean on sealed hierarchies; kotlinx.coroutines' `SelectClause` and channel result types (`ChannelResult`) are sealed so downstream `when` blocks stay exhaustive as the library evolves.

## See Also

- [`type-sealed-when-exhaustive`](type-sealed-when-exhaustive.md) - the exhaustive `when` this hierarchy enables
- [`type-data-object-singleton`](type-data-object-singleton.md) - use `data object` for stateless sealed variants
- [`api-sealed-for-state`](api-sealed-for-state.md) - applying sealed hierarchies to UI/domain state modeling
- [`err-result-explicit-modeling`](err-result-explicit-modeling.md) - sealed hierarchies as an error-modeling tool
