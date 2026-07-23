# api-visibility-internal

> Default to `internal`/`private`; expose only the intended public surface

## Why It Matters

Every `public` declaration becomes part of your binary compatibility contract - clients may depend on it, and changing or removing it becomes a breaking change. Defaulting to the narrowest visibility that works (`private` inside a file/class, `internal` across a module) keeps the real API surface small, makes refactoring safe, and forces you to consciously decide what to publish.

## Bad

```kotlin
// Every member is implicitly public - the default - even though only
// two of these are meant to be used outside this module.
class OrderProcessor(val repository: OrderRepository) {
    fun process(order: Order): Result = validate(order).let(::submit)

    fun validate(order: Order): ValidationResult = /* internal helper, leaked */
        ValidationResult.Valid

    fun submit(validation: ValidationResult): Result = /* internal helper, leaked */
        Result.Success

    var retryCount = 0  // mutable state leaked to every caller
}
```

## Good

```kotlin
class OrderProcessor(private val repository: OrderRepository) {
    private var retryCount = 0

    fun process(order: Order): Result = validate(order).let(::submit)

    private fun validate(order: Order): ValidationResult = ValidationResult.Valid

    private fun submit(validation: ValidationResult): Result = Result.Success
}
```

## Module-Scoped Helpers with `internal`

```kotlin
// Shared across files in the same Gradle module, but invisible to consumers
// of the published artifact - a middle ground between private and public.
internal class RetryPolicy(val maxAttempts: Int, val backoffMs: Long)

internal fun OrderRepository.findWithRetry(id: String, policy: RetryPolicy): Order? {
    repeat(policy.maxAttempts) { attempt ->
        find(id)?.let { return it }
    }
    return null
}

// Only this stays public - the actual contract for consumers
class OrderRepository {
    fun find(id: String): Order? = TODO()
}
```

## Detekt/ktlint Rule

Enable Kotlin's [explicit API mode](https://kotlinlang.org/docs/whatsnew14.html#explicit-api-mode-for-library-authors) in library modules (`explicitApi()` in `build.gradle.kts`) so the compiler forces an explicit visibility modifier and return type on every public declaration - it becomes impossible to accidentally publish something by omission.

```kotlin
// build.gradle.kts
kotlin {
    explicitApi()  // or explicitApiWarning() to start with warnings only
}
```

## See Also

- [`lint-explicit-api-warning`](lint-explicit-api-warning.md) - enforcing explicit visibility with the compiler
- [`proj-explicit-api-mode`](proj-explicit-api-mode.md) - project-wide explicit API configuration
- [`proj-api-vs-impl-module`](proj-api-vs-impl-module.md) - splitting api/impl modules for a similar boundary at scale
- [`proj-internal-module-boundary`](proj-internal-module-boundary.md) - using `internal` to enforce module boundaries
