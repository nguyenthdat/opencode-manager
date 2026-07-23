# type-smart-cast-val

> Prefer `val` and local variables so the compiler can smart-cast

## Why It Matters

Kotlin's smart cast automatically treats a nullable or supertype value as its checked, narrower type after an `is` or `!= null` check — but only when the compiler can prove the value can't change between the check and the use. `var` properties (especially `var` class properties, which could be mutated by another thread or a custom setter) defeat that proof, forcing you back to explicit casts or `!!`.

## Bad

```kotlin
class Handler {
    var listener: ClickListener? = null

    fun notifyClick() {
        if (listener != null) {
            listener.onClick()  // Compile error: smart cast impossible on a mutable property
        }
    }
}

fun describe(value: Any) {
    var v = value
    if (v is String) {
        v = v.trim()  // Reassigning defeats smart cast for later uses of `v`
        // if (v is String) here would need re-checking
    }
}
```

## Good

```kotlin
class Handler {
    var listener: ClickListener? = null

    fun notifyClick() {
        val current = listener       // Copy into an immutable local
        if (current != null) {
            current.onClick()        // Smart cast works on the local val
        }
        // Or simply: listener?.onClick()
    }
}

fun describe(value: Any) {
    val v = value
    if (v is String) {
        val trimmed = v.trim()       // New val instead of reassigning
        println(trimmed)
    }
}
```

## Why `var` Breaks The Proof

A `var` class property can be mutated between the null check and its use (by another thread, a custom setter with side effects, or reentrant code), so the compiler conservatively refuses the smart cast rather than risk a `ClassCastException`. A local `val` inside a single function body has no such risk, so the compiler allows it.

```kotlin
class Repository {
    // A custom getter means the compiler can't even assume two reads return the same value
    var cache: Data? = null
        get() = if (isExpired()) null else field
}
```

## See Also

- [`fn-val-over-var`](fn-val-over-var.md) - the general preference for immutability this rule specializes
- [`type-safe-call-operator`](type-safe-call-operator.md) - `?.` sidesteps smart-cast limitations entirely
- [`type-avoid-not-null-assert`](type-avoid-not-null-assert.md) - `!!` is the fallback this rule helps you avoid
