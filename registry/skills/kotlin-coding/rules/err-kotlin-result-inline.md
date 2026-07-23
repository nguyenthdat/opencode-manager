# err-kotlin-result-inline

> Use the stdlib `Result<T>` for simple, local fallible operations

## Why It Matters

Defining a custom sealed type for every small fallible operation is overkill when you just need to capture "success or an exception" for a short-lived, local computation — the stdlib `Result<T>` (an inline class wrapping either a value or a `Throwable`) already models exactly that with zero extra ceremony and a rich set of combinators (`map`, `mapCatching`, `recover`, `fold`, `getOrElse`).

## Bad

```kotlin
fun parseAndDouble(input: String): Int {
    return try {
        input.toInt() * 2
    } catch (e: NumberFormatException) {
        throw e  // Caller still has to try/catch - Result buys nothing here if unused
    }
}

// Hand-rolling a one-off wrapper for a single local use
class ParseOutcome(val value: Int?, val error: Exception?)
```

## Good

```kotlin
fun parseAndDouble(input: String): Result<Int> =
    runCatching { input.toInt() * 2 }

fun handleInput(raw: String) {
    parseAndDouble(raw)
        .onSuccess { println("Doubled: $it") }
        .onFailure { println("Invalid input: ${it.message}") }
}

// Combinators chain naturally
fun parsePositiveDouble(input: String): Result<Int> =
    runCatching { input.toInt() }
        .mapCatching { if (it <= 0) error("must be positive") else it * 2 }

val value = parsePositiveDouble("21").getOrElse { 0 }
```

## When To Reach For A Sealed Type Instead

`Result<T>` only distinguishes "success" from "one `Throwable`" — once callers need to branch on *which kind* of failure occurred with exhaustive `when` checking, or the failure isn't naturally an exception at all, a sealed result type is the better fit.

```kotlin
// Result<T> is fine here: one failure reason, purely local
fun readIntFromEnv(name: String): Result<Int> =
    runCatching { System.getenv(name)!!.toInt() }

// A sealed type is better here: multiple distinguishable, domain-relevant outcomes
sealed interface ValidationResult {
    data object Valid : ValidationResult
    data class TooShort(val minLength: Int) : ValidationResult
    data class ContainsInvalidChars(val chars: Set<Char>) : ValidationResult
}
```

## See Also

- [`err-result-explicit-modeling`](err-result-explicit-modeling.md) - when to graduate to a custom sealed type
- [`err-runcatching-pitfalls`](err-runcatching-pitfalls.md) - the coroutine cancellation caveat of `runCatching`
- [`err-arrow-either-modeling`](err-arrow-either-modeling.md) - a richer, two-typed alternative from Arrow
