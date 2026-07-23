# fn-scope-function-also

> Use `also` for side effects that shouldn't change the returned value

## Why It Matters

`also` receives the object as `it` and always returns the original object unchanged, which makes intent explicit: whatever happens inside the block (logging, validation, adding to a collection) is a side effect, not a transformation. That reads more honestly than reusing `let` for the same purpose, where the lambda's return value could easily be mistaken for the thing being propagated.

## Bad

```kotlin
fun createUser(name: String): User {
    val user = User(name)
    println("Created user: $user")  // side effect mixed into the main construction flow
    auditLog.record("user_created", user.id)
    return user
}

// Using let for a pure side effect is misleading - readers expect a transform
val result = fetchData().let {
    println("Fetched: $it")
    it  // must manually return `it` or the side effect silently changes what's returned
}
```

## Good

```kotlin
fun createUser(name: String): User =
    User(name).also {
        println("Created user: $it")
        auditLog.record("user_created", it.id)
    }
// Clearly a side effect: `also` guarantees the User itself is what's returned

val result = fetchData().also { println("Fetched: $it") }
// No risk of the side-effect block accidentally changing what `result` holds
```

## Chaining `also` for Multiple Independent Side Effects

```kotlin
val order = Order(items)
    .also { validate(it) }
    .also { logOrder(it) }
    .also { metrics.increment("orders.created") }
// Each `also` is independently a no-op with respect to the value being passed along
```

## `also` vs `let`

```kotlin
// let:  returns lambda RESULT  -> use for transforms: x.let { it.toUpperCase() }
// also: returns the RECEIVER   -> use for side effects: x.also { log(it) }

val validated = rawInput
    .trim()
    .also { require(it.isNotEmpty()) { "input required" } }  // validation side effect
    .let { it.uppercase() }                                   // actual transform
```

## See Also

- [`fn-scope-function-let`](fn-scope-function-let.md) - the transform-returning counterpart to `also`
- [`fn-scope-function-apply`](fn-scope-function-apply.md) - `this`-style sibling that also returns the receiver
- [`doc-inline-why-not-what`](doc-inline-why-not-what.md) - comment on *why* a side effect exists inside an `also` block
