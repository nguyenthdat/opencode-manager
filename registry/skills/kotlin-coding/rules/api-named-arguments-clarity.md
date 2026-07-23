# api-named-arguments-clarity

> Use named arguments at call sites with multiple same-typed parameters

## Why It Matters

When several parameters share a type (`String`, `Int`, `Boolean`), positional calls are easy to get subtly wrong - two adjacent arguments swap silently and the compiler can't catch it because both are type-correct. Named arguments make the mapping explicit at the call site, turning a class of bugs into something visually obvious during review.

## Bad

```kotlin
fun createUser(firstName: String, lastName: String, email: String, isAdmin: Boolean) { /* ... */ }

createUser("admin@example.com", "Jane", "Doe", true)
// Compiles fine, but firstName/lastName/email are all scrambled - no error, just a bug

fun resize(width: Int, height: Int, x: Int, y: Int) { /* ... */ }
resize(100, 200, 0, 0)  // Which is width vs height vs x vs y? Not obvious at a glance
```

## Good

```kotlin
fun createUser(firstName: String, lastName: String, email: String, isAdmin: Boolean) { /* ... */ }

createUser(
    firstName = "Jane",
    lastName = "Doe",
    email = "admin@example.com",
    isAdmin = true,
)
// The mistake above becomes impossible to make silently - names must match declaration order

fun resize(width: Int, height: Int, x: Int, y: Int) { /* ... */ }
resize(width = 100, height = 200, x = 0, y = 0)
```

## Combining with Trailing Defaults

```kotlin
fun schedule(
    task: String,
    delayMs: Long = 0,
    repeat: Boolean = false,
    priority: Int = 0,
) { /* ... */ }

// Skip earlier defaults entirely by naming only the ones you need
schedule("cleanup", priority = 10)
schedule(task = "sync", repeat = true)
```

## When Positional Is Fine

```kotlin
// Single parameter, or parameters whose order is unambiguous from context/convention
fun square(n: Int): Int = n * n
square(4)  // No ambiguity, naming would be noise

// Well-known conventions (e.g., Pair, first/second math operations)
val point = Pair(3, 4)
```

## Detekt Rule

`detekt`'s `UseCheckOrError`-style readability rules don't cover this directly, but a custom `detekt` rule or code review checklist item enforcing "3+ same-type parameters require named arguments" catches this pattern; IntelliJ also inlays parameter name hints by default to surface the risk even for unnamed calls.

## See Also

- [`api-default-params-over-overloads`](api-default-params-over-overloads.md) - default parameters pair naturally with named arguments
- [`anti-primitive-obsession`](anti-primitive-obsession.md) - wrapping primitives in types is a stronger fix for the same ambiguity
- [`api-copy-with-defaults`](api-copy-with-defaults.md) - named arguments make `copy()` calls self-documenting
