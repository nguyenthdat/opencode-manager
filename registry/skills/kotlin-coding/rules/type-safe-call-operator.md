# type-safe-call-operator

> Use `?.` safe calls instead of manual null checks

## Why It Matters

Manual `if (x != null)` checks scattered through code are verbose, easy to forget on a new call site, and don't compose across chains of nullable properties. The `?.` operator short-circuits to `null` the instant it hits a null receiver, letting you express a whole chain of nullable navigation in one expression while the compiler tracks nullability for you.

## Bad

```kotlin
fun printCityName(user: User?) {
    if (user != null) {
        if (user.address != null) {
            if (user.address.city != null) {
                println(user.address.city.name)
            }
        }
    }
}

fun getLength(text: String?): Int {
    if (text != null) {
        return text.length
    }
    return 0
}
```

## Good

```kotlin
fun printCityName(user: User?) {
    println(user?.address?.city?.name)
}

fun getLength(text: String?): Int {
    return text?.length ?: 0
}

// Safe calls chain naturally with function calls too
fun uppercaseCity(user: User?): String? {
    return user?.address?.city?.name?.uppercase()
}
```

## Combining With Other Operators

```kotlin
// Safe call + let: only run a block when non-null
user?.let { u -> logger.info("Found user ${u.id}") }

// Safe call + Elvis: supply a fallback in one expression
val city = user?.address?.city?.name ?: "Unknown"

// Safe call on a function reference for a nullable receiver
val length: Int? = text?.length
```

## Detekt/ktlint Rule

Detekt's `SafeCast` and `UnnecessarySafeCall` rules flag redundant safe calls (e.g. `x?.let { }` where `x` is already known non-null), nudging code toward the minimal correct use of `?.`. ktlint has no dedicated rule here since this is a semantic, not formatting, concern — rely on Detekt plus the compiler's nullability diagnostics.

## See Also

- [`type-elvis-default`](type-elvis-default.md) - pairs with `?.` to supply a fallback value
- [`type-let-scope-nullable`](type-let-scope-nullable.md) - use `?.let { }` to scope work on a non-null value
- [`type-avoid-not-null-assert`](type-avoid-not-null-assert.md) - safe calls are the primary alternative to `!!`
- [`anti-excessive-nullable-types`](anti-excessive-nullable-types.md) - don't let nullable chains signal a deeper design problem
