# err-error-unreachable

> Use `error()` to fail loudly on branches that must be unreachable

## Why It Matters

When a `when` or `else` branch "can't happen" given your current understanding of the code, silently returning a placeholder value hides the bug if that assumption is ever violated — by a future refactor, a new enum entry, or a library upgrade. `error()` (which is typed `Nothing` and throws `IllegalStateException`) makes the assumption explicit and turns a violated assumption into a loud, immediate failure instead of quietly wrong output.

## Bad

```kotlin
enum class Direction { NORTH, SOUTH, EAST, WEST }

fun opposite(direction: Direction): Direction = when (direction) {
    Direction.NORTH -> Direction.SOUTH
    Direction.SOUTH -> Direction.NORTH
    Direction.EAST -> Direction.WEST
    else -> Direction.NORTH  // Silently wrong if WEST case was simply forgotten
}
```

## Good

```kotlin
enum class Direction { NORTH, SOUTH, EAST, WEST }

fun opposite(direction: Direction): Direction = when (direction) {
    Direction.NORTH -> Direction.SOUTH
    Direction.SOUTH -> Direction.NORTH
    Direction.EAST -> Direction.WEST
    Direction.WEST -> Direction.EAST
    // With every case covered, `when` is already exhaustive - no else needed at all
}

// error() is for a genuinely impossible branch, e.g. after external validation
fun parseDirection(code: Int): Direction = when (code) {
    0 -> Direction.NORTH
    1 -> Direction.SOUTH
    2 -> Direction.EAST
    3 -> Direction.WEST
    else -> error("Unreachable: code $code was already validated to be in 0..3")
}
```

## `error()` Documents An Assumption, It Doesn't Replace Validation

Use `error()` only after the actual validation (`require`/`check`) has already run elsewhere, as a way of telling the compiler and the next reader "this path is provably dead given the checks above" — not as a substitute for validating the input in the first place.

```kotlin
fun processStatus(status: String): String {
    require(status in setOf("OPEN", "CLOSED", "PENDING")) { "Unknown status: $status" }
    return when (status) {
        "OPEN" -> "Active"
        "CLOSED" -> "Done"
        "PENDING" -> "Waiting"
        else -> error("Unreachable after require() above")
    }
}
```

## See Also

- [`type-nothing-return`](type-nothing-return.md) - explains the `Nothing` typing that makes `error()` compose
- [`err-require-precondition`](err-require-precondition.md) - the actual validation that should precede `error()`
- [`type-sealed-when-exhaustive`](type-sealed-when-exhaustive.md) - sealed types make many `error()` fallbacks unnecessary
