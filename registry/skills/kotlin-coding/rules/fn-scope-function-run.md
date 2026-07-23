# fn-scope-function-run

> Use `run` for a scoped computation that returns a result

## Why It Matters

`run` gives you `this`-style access to the receiver (no `it.` qualification needed) while still returning the lambda's result, making it the right tool when you need to perform several related operations on an object and produce a derived value - without introducing an intermediate variable that leaks beyond its single use.

## Bad

```kotlin
val connection = openConnection()
connection.setTimeout(5000)
connection.setRetries(3)
val response = connection.execute()  // `connection` variable leaks into surrounding scope
// caller might accidentally reuse `connection` after this block, unintentionally

fun parseConfig(raw: String): Config {
    val trimmed = raw.trim()
    val lines = trimmed.lines()
    val pairs = lines.map { it.split("=") }
    return Config(pairs.associate { it[0] to it[1] })  // intermediate vals only used here
}
```

## Good

```kotlin
val response = openConnection().run {
    setTimeout(5000)
    setRetries(3)
    execute()  // last expression is the block's result
}

fun parseConfig(raw: String): Config = raw.run {
    val pairs = trim().lines().map { it.split("=") }
    Config(pairs.associate { it[0] to it[1] })
}
```

## Non-Extension `run` for Grouping Statements

```kotlin
val cacheDir = run {
    val base = System.getProperty("user.home")
    val subdir = "myapp/cache"
    File(base, subdir).apply { mkdirs() }
}
// Groups setup logic into one expression, scoping `base`/`subdir` to just this computation
```

## `run` vs `let` vs `with`

```kotlin
// run (extension):   receiver.run { this-style access, returns result }  - chaining + computation
// let (extension):   receiver.let { it-style access, returns result }    - null-safe transforms
// with (non-ext.):   with(receiver) { this-style access, returns result } - receiver already non-null
config?.run { validate(); apply() }   // natural for nullable receivers, unlike `with`
```

## See Also

- [`fn-scope-function-with`](fn-scope-function-with.md) - the non-extension sibling for non-null receivers already in scope
- [`fn-scope-function-let`](fn-scope-function-let.md) - use when `it`-style access reads better than `this`
- [`fn-scope-function-apply`](fn-scope-function-apply.md) - use when you want the receiver back, not a computed result
