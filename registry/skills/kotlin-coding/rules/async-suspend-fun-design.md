# async-suspend-fun-design

> Design `suspend` functions to be main-safe and cancellation-aware

## Why It Matters

A `suspend` function is a contract: callers should be able to invoke it from any dispatcher, including `Dispatchers.Main`, without blocking that thread, and should be able to cancel it promptly. Violating either half of that contract forces every caller to know internal implementation details, which defeats the purpose of hiding threading behind `suspend`.

## Bad

```kotlin
// BAD: not main-safe — blocks whatever thread calls it
suspend fun loadUser(id: String): User {
    return database.findUserBlocking(id) // blocking JDBC call, no dispatcher switch
}

// BAD: ignores cancellation entirely inside a long CPU loop
suspend fun computeChecksum(data: ByteArray): String {
    var hash = 0L
    for (byte in data) { // never suspends or checks isActive
        hash = hash * 31 + byte
    }
    return hash.toString(16)
}
```

## Good

```kotlin
// Main-safe: the function itself owns the dispatcher switch
suspend fun loadUser(id: String): User = withContext(Dispatchers.IO) {
    database.findUserBlocking(id)
}

// Cancellation-aware: cooperates during long-running CPU work
suspend fun computeChecksum(data: ByteArray): String = withContext(Dispatchers.Default) {
    var hash = 0L
    for ((index, byte) in data.withIndex()) {
        if (index % 10_000 == 0) {
            ensureActive() // throws CancellationException if the caller cancelled
        }
        hash = hash * 31 + byte
    }
    hash.toString(16)
}
```

## The Contract

- Callable from `Dispatchers.Main` without blocking it (do the dispatcher switch internally with `withContext`).
- Returns promptly when cancelled, either by delegating to another suspend function (which already checks) or by calling `ensureActive()`/`yield()` periodically in tight loops.
- Does not swallow `CancellationException` — let it propagate.

```kotlin
// BAD: swallows cancellation
suspend fun fragile(): Result<Data> = try {
    Result.success(fetch())
} catch (e: Exception) { // catches CancellationException too!
    Result.failure(e)
}

// GOOD: rethrow cancellation, only wrap real failures
suspend fun robust(): Result<Data> = try {
    Result.success(fetch())
} catch (e: CancellationException) {
    throw e
} catch (e: Exception) {
    Result.failure(e)
}
```

## See Also

- [`async-cancellation-cooperation`](async-cancellation-cooperation.md) - the mechanics of cooperative cancellation
- [`async-avoid-blocking-calls`](async-avoid-blocking-calls.md) - main-safety in practice
- [`err-runcatching-pitfalls`](err-runcatching-pitfalls.md) - why generic catch blocks are dangerous here
- [`anti-runcatching-swallow-cancellation`](anti-runcatching-swallow-cancellation.md) - the anti-pattern this guards against
