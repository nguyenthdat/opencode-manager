# type-let-scope-nullable

> Use `?.let { }` to scope work on a non-null value

## Why It Matters

`?.let { }` runs its block only when the receiver is non-null, and inside the block the value is bound to a non-null parameter (conventionally `it`), so you get scoped, smart-cast-safe access without a separate `if` statement. This is especially valuable for `var` properties and cross-thread values where the compiler cannot smart-cast a plain null check.

## Bad

```kotlin
var cachedUser: User? = null

fun notifyIfPresent() {
    if (cachedUser != null) {
        // Compiler may refuse to smart-cast a mutable property here,
        // especially across a lambda or another thread
        sendNotification(cachedUser!!.email, cachedUser!!.name)
    }
}

fun updateAddress(address: Address?) {
    if (address != null) {
        val formatted = format(address)
        repository.save(formatted)
    }
}
```

## Good

```kotlin
var cachedUser: User? = null

fun notifyIfPresent() {
    cachedUser?.let { user ->
        sendNotification(user.email, user.name)
    }
}

fun updateAddress(address: Address?) {
    address?.let { repository.save(format(it)) }
}
```

## Chaining Multiple Nullables

```kotlin
fun sendWelcomeEmail(user: User?, template: Template?) {
    user?.let { u ->
        template?.let { t ->
            emailer.send(t.render(u), to = u.email)
        }
    }
}

// Prefer combining explicitly when both must be present -
// nested `let` is easy to misread as "either" instead of "both"
fun sendWelcomeEmailClearer(user: User?, template: Template?) {
    if (user == null || template == null) return
    emailer.send(template.render(user), to = user.email)
}
```

## See Also

- [`type-safe-call-operator`](type-safe-call-operator.md) - `?.let` builds directly on the safe call operator
- [`fn-scope-function-let`](fn-scope-function-let.md) - general guidance on choosing `let` among scope functions
- [`type-avoid-not-null-assert`](type-avoid-not-null-assert.md) - `?.let` avoids the `!!` this pattern replaces
