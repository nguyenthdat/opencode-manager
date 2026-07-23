# fn-scope-function-let

> Use `let` to scope a transform on a single (often nullable) value

## Why It Matters

`let` takes the receiver as `it` and returns the lambda's result, which makes it the natural fit for null-safe chaining (`?.let { ... }`) and for scoping a temporary variable to a single expression without polluting the surrounding scope with an extra `val`. Reaching for `let` outside that use case - especially nesting several `let`s - makes code harder to read than plain sequential statements.

## Bad

```kotlin
var user: User? = fetchUser()
if (user != null) {
    val profile = buildProfile(user)   // extra val leaks into outer scope
    sendWelcomeEmail(profile)
}

// Or: manual null check instead of idiomatic null-safe scoping
val cached = cache.get(key)
val result: String
if (cached != null) {
    result = cached.uppercase()
} else {
    result = "default"
}
```

## Good

```kotlin
val user: User? = fetchUser()
user?.let { buildProfile(it) }?.let { sendWelcomeEmail(it) }

val result: String = cache.get(key)?.let { it.uppercase() } ?: "default"

// Scoping a value to exactly where it's used, nothing leaks outward
val timestamp = System.currentTimeMillis().let { now ->
    Instant.ofEpochMilli(now)
}
```

## Avoid Over-Nesting

```kotlin
// Bad: nested `let` chains read worse than sequential code would
user?.let { u ->
    u.address?.let { addr ->
        addr.city?.let { city ->
            println(city)
        }
    }
}

// Better: early return or safe-call chain
val city = user?.address?.city ?: return
println(city)
```

## `let` vs the Other Scope Functions

```kotlin
// let:  needs `it`, returns lambda result       -> null-safe chains, transforms
// run:  needs `this`, returns lambda result      -> scoped computation and object config
// with: needs `this`, returns lambda result       -> grouped calls on a non-null receiver
// apply:needs `this`, returns the receiver        -> configure-and-return
// also: needs `it`, returns the receiver          -> side effects (logging, validation)
```

## See Also

- [`fn-scope-function-run`](fn-scope-function-run.md) - use when the receiver is already non-null and in scope
- [`fn-scope-function-also`](fn-scope-function-also.md) - use when you want a side effect but need the original value back
- [`type-let-scope-nullable`](type-let-scope-nullable.md) - deeper dive on null-safe `let` chains
- [`type-avoid-not-null-assert`](type-avoid-not-null-assert.md) - `let` is the safe alternative to `!!`
