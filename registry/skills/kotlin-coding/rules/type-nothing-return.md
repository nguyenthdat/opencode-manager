# type-nothing-return

> Use the `Nothing` type for functions that never return normally

## Why It Matters

`Nothing` is Kotlin's bottom type — it has no instances and is a subtype of every other type — which is exactly what lets `throw`, `TODO()`, and `exitProcess()` type-check anywhere an expression is expected, including as the branch of an `if`/`when` or the right-hand side of `?:`. Declaring your own helper functions as returning `Nothing` lets the compiler propagate smart casts and exhaustiveness through them, instead of just seeing "some function call" and giving up.

## Bad

```kotlin
fun failWith(message: String) {  // Return type inferred as Unit
    throw IllegalStateException(message)
}

fun getConfig(value: String?): String {
    if (value == null) {
        failWith("config missing")
    }
    return value  // Compile error: compiler doesn't know failWith() never returns,
                  // so `value` is still seen as String?
}
```

## Good

```kotlin
fun failWith(message: String): Nothing {
    throw IllegalStateException(message)
}

fun getConfig(value: String?): String {
    if (value == null) {
        failWith("config missing")
    }
    return value  // Smart-cast to String - compiler knows failWith() never returns
}
```

## Nothing In Elvis And When

```kotlin
fun requirePositive(n: Int): Int = if (n > 0) n else error("must be positive")
// error() is declared as `fun error(message: Any): Nothing`

fun describe(code: Int): String = when (code) {
    200 -> "OK"
    404 -> "Not Found"
    else -> throw IllegalArgumentException("Unknown code $code")
    // `throw` has type Nothing, so it unifies with String from the other branches
}

val port: Int = System.getenv("PORT")?.toIntOrNull()
    ?: raiseConfigError("PORT must be a valid integer")  // raiseConfigError(): Nothing
```

## `Nothing?` vs `Nothing`

`Nothing?` (nullable Nothing) has exactly one value, `null`, and is the inferred type of a bare `null` literal — different from `Nothing`, which has zero values and means "never completes."

```kotlin
val x = null           // Type: Nothing?
val list: List<Nothing> = emptyList()  // Valid - Nothing is a subtype of every type
```

## See Also

- [`type-elvis-default`](type-elvis-default.md) - relies on `Nothing`-typed `throw`/`return` as the fallback branch
- [`err-error-unreachable`](err-error-unreachable.md) - `error()` is the stdlib function typed as `Nothing`
- [`err-require-precondition`](err-require-precondition.md) - `require()` throws via a `Nothing`-typed path internally
