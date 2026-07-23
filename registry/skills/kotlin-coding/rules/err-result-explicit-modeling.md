# err-result-explicit-modeling

> Model expected, recoverable failure with a sealed `Result`-like type

## Why It Matters

A nullable return or the stdlib `Result<T>` can tell you *that* something failed, but not always *why* in a way callers can branch on distinctly. A custom sealed type turns every possible outcome into a named, exhaustively-checked case, so callers can't accidentally treat a validation failure the same way as a network timeout.

## Bad

```kotlin
fun parseAge(input: String): Int? {
    val value = input.toIntOrNull() ?: return null
    if (value < 0 || value > 150) return null
    return value
    // Caller only learns "it failed" - not whether it was unparsable or out of range
}

fun handleForm(rawAge: String) {
    val age = parseAge(rawAge)
    if (age == null) {
        showError("Invalid age")  // Same generic message for every failure reason
    }
}
```

## Good

```kotlin
sealed interface AgeParseResult {
    data class Valid(val age: Int) : AgeParseResult
    data object NotANumber : AgeParseResult
    data class OutOfRange(val value: Int) : AgeParseResult
}

fun parseAge(input: String): AgeParseResult {
    val value = input.toIntOrNull() ?: return AgeParseResult.NotANumber
    if (value < 0 || value > 150) return AgeParseResult.OutOfRange(value)
    return AgeParseResult.Valid(value)
}

fun handleForm(rawAge: String) {
    when (val result = parseAge(rawAge)) {
        is AgeParseResult.Valid -> proceed(result.age)
        is AgeParseResult.NotANumber -> showError("Please enter a number")
        is AgeParseResult.OutOfRange -> showError("Age ${result.value} is out of range")
    }
}
```

## Evidence

Arrow's `Either<E, A>` generalizes this exact pattern into a reusable two-case sealed type, and ktor's `HttpClient` response handling encourages mapping status codes into sealed result types at the call boundary rather than throwing for every non-2xx response.

## See Also

- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - the mechanism this pattern is built on
- [`err-kotlin-result-inline`](err-kotlin-result-inline.md) - lighter-weight stdlib alternative for simple cases
- [`err-arrow-either-modeling`](err-arrow-either-modeling.md) - a reusable, generic two-case version of this pattern
- [`err-exceptions-for-exceptional`](err-exceptions-for-exceptional.md) - why this replaces exceptions for expected failures
