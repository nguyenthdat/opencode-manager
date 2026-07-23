# anti-magic-numbers

> Don't scatter unexplained magic numbers/strings through code

## Why It Matters

A bare `42`, `3600_000`, or `"application/json"` repeated across a codebase forces every reader to reverse-engineer what it means and forces every future change to find and update each occurrence by hand, with no compiler help if one is missed. Naming the value once as a constant documents its meaning and makes changing it a one-line edit.

## Bad

```kotlin
fun isEligibleForDiscount(user: User): Boolean {
    return user.accountAgeDays > 365 && user.purchaseCount >= 5 // why 365? why 5?
}

fun scheduleRefresh() {
    handler.postDelayed({ refresh() }, 3600_000) // is this ms? seconds? why this value?
}

fun buildRequest(): Request = Request.Builder()
    .header("Content-Type", "application/json") // repeated in 12 other files
    .build()
```

## Good

```kotlin
private const val MIN_ACCOUNT_AGE_DAYS = 365
private const val MIN_PURCHASES_FOR_DISCOUNT = 5

fun isEligibleForDiscount(user: User): Boolean {
    return user.accountAgeDays > MIN_ACCOUNT_AGE_DAYS &&
        user.purchaseCount >= MIN_PURCHASES_FOR_DISCOUNT
}

private val REFRESH_INTERVAL = 1.hours // kotlin.time.Duration - unit is unambiguous

fun scheduleRefresh() {
    handler.postDelayed({ refresh() }, REFRESH_INTERVAL.inWholeMilliseconds)
}

object ContentType {
    const val JSON = "application/json"
}

fun buildRequest(): Request = Request.Builder()
    .header("Content-Type", ContentType.JSON)
    .build()
```

## When It's Still Sometimes Seen

A value used exactly once, in an obviously self-explanatory context, doesn't need extraction — `list.getOrElse(0) { default }` doesn't need a `FIRST_INDEX` constant. The rule targets values that are *repeated* or whose *meaning isn't obvious from context*.

## Detekt Rule

```yaml
# config/detekt.yml
style:
  MagicNumber:
    active: true
    ignoreNumbers: ['-1', '0', '1', '2']
    ignoreAnnotation: true
    ignoreEnums: true
```

## See Also

- [`anti-stringly-typed-data`](anti-stringly-typed-data.md) - the same problem for structured string values
- [`name-constants-screaming-snake`](name-constants-screaming-snake.md) - the naming convention for the extracted constants
- [`interop-const-val-compile-time`](interop-const-val-compile-time.md) - use `const val` for genuine compile-time constants
