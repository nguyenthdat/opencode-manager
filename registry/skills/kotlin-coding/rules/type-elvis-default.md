# type-elvis-default

> Use `?:` Elvis operator to supply defaults for nullable values

## Why It Matters

Without the Elvis operator, providing a fallback for a nullable value requires an explicit `if`/`else` block, which buries simple default logic in noise and is easy to get wrong (e.g. returning early from the wrong scope). `?:` keeps the fallback inline, next to the value it defaults, and works as an expression so it can feed directly into `return`, assignment, or another call.

## Bad

```kotlin
fun greeting(name: String?): String {
    val resolved: String
    if (name != null) {
        resolved = name
    } else {
        resolved = "Guest"
    }
    return "Hello, $resolved"
}

fun findUser(id: String): User {
    val user = repository.find(id)
    if (user == null) {
        throw NoSuchElementException("User $id not found")
    }
    return user
}
```

## Good

```kotlin
fun greeting(name: String?): String {
    val resolved = name ?: "Guest"
    return "Hello, $resolved"
}

fun findUser(id: String): User {
    return repository.find(id) ?: throw NoSuchElementException("User $id not found")
}
```

## Elvis With Control Flow

The right-hand side of `?:` can be any expression, including `return`, `throw`, or `continue`/`break` inside a loop, because those are typed as `Nothing` and unify with any type.

```kotlin
fun processLine(line: String?, results: MutableList<Int>) {
    val trimmed = line?.trim() ?: return
    val parsed = trimmed.toIntOrNull() ?: run {
        logger.warn("Skipping invalid line: $trimmed")
        return
    }
    results += parsed
}

for (line in lines) {
    val value = line.toIntOrNull() ?: continue
    sum += value
}
```

## See Also

- [`type-safe-call-operator`](type-safe-call-operator.md) - `?.` is the natural left-hand side of `?:`
- [`type-avoid-not-null-assert`](type-avoid-not-null-assert.md) - Elvis with `throw`/`return` replaces most `!!` uses
- [`type-nothing-return`](type-nothing-return.md) - explains why `throw`/`return` type-check as the Elvis fallback
- [`err-require-precondition`](err-require-precondition.md) - alternative when the null case is a caller error
