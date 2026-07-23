# type-sealed-when-exhaustive

> Pair sealed types with exhaustive `when` and no `else` branch

## Why It Matters

An `else` branch on a `when` over a sealed type silently swallows new variants: when someone adds a case to the hierarchy later, the compiler stays quiet and the `else` branch runs instead of forcing a decision. Dropping `else` turns every new variant into a compile error at each `when` site, which is exactly the safety net sealed types exist to provide.

## Bad

```kotlin
sealed interface NetworkState {
    data object Loading : NetworkState
    data class Success(val data: String) : NetworkState
    data class Error(val message: String) : NetworkState
}

fun describe(state: NetworkState): String = when (state) {
    is NetworkState.Loading -> "Loading..."
    is NetworkState.Success -> "Got: ${state.data}"
    else -> "Something else"  // Error case is silently mishandled
}
```

## Good

```kotlin
fun describe(state: NetworkState): String = when (state) {
    is NetworkState.Loading -> "Loading..."
    is NetworkState.Success -> "Got: ${state.data}"
    is NetworkState.Error -> "Failed: ${state.message}"
    // Adding a new NetworkState variant now fails to compile here
    // until this `when` is updated
}
```

## Statement vs Expression Position

`when` is only forced to be exhaustive by the compiler when it is used as an expression (its value is assigned, returned, or passed). As a statement, a non-exhaustive `when` compiles silently, so prefer using it as an expression whenever exhaustiveness matters.

```kotlin
// Statement position - NOT checked for exhaustiveness, even over a sealed type
fun logState(state: NetworkState) {
    when (state) {
        is NetworkState.Loading -> println("loading")
        is NetworkState.Success -> println("success")
        // Missing Error case compiles with a warning at most
    }
}

// Force exhaustiveness by making it an expression
fun logState(state: NetworkState) {
    val message = when (state) {
        is NetworkState.Loading -> "loading"
        is NetworkState.Success -> "success"
        is NetworkState.Error -> "error"
    }
    println(message)
}
```

## Detekt/ktlint Rule

Detekt's `ElseCaseInsteadOfExhaustiveWhen` flags an `else` branch on a `when` over a sealed or enum type, and `mandatory-when-covered` style checks (via `EXHAUSTIVE_WHEN_STATEMENTS` compiler warning, promoted to error with `-Werror`) catch the statement-position gap.

```yaml
style:
  UselessWhenBlock:
    active: true
```

## See Also

- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - the closed hierarchy that makes exhaustiveness possible
- [`anti-deep-nesting-when`](anti-deep-nesting-when.md) - keeping `when` branches flat and readable
- [`lint-compiler-warnings-as-errors`](lint-compiler-warnings-as-errors.md) - promotes the non-exhaustive-when warning to a build failure
