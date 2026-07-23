# err-runcatching-pitfalls

> Know that `runCatching` also catches `CancellationException`

## Why It Matters

`runCatching` wraps its block in a plain `catch (e: Throwable)`, which means inside a coroutine it also captures `CancellationException` — the exception structured concurrency relies on to unwind a cancelled job. Swallowing it silently breaks cancellation propagation: the coroutine's job may look cancelled to the scheduler while your code keeps running as if the failure were an ordinary error.

## Bad

```kotlin
suspend fun fetchAndCache(id: String): Data? {
    return runCatching {
        api.fetch(id)  // Suspends - can be cancelled mid-flight
    }.onFailure { e ->
        logger.warn("fetch failed", e)  // Also logs cancellation as if it were a real failure
    }.getOrNull()
    // If the coroutine was cancelled, this swallows CancellationException instead of
    // rethrowing it, so the parent scope never learns the coroutine actually stopped
}
```

## Good

```kotlin
suspend fun fetchAndCache(id: String): Data? {
    return runCatching {
        api.fetch(id)
    }.onFailure { e ->
        if (e is CancellationException) throw e  // Rethrow so cancellation propagates
        logger.warn("fetch failed", e)
    }.getOrNull()
}

// Or avoid runCatching for suspending code entirely and use a coroutine-aware helper
suspend fun <T> suspendRunCatching(block: suspend () -> T): Result<T> =
    try {
        Result.success(block())
    } catch (e: CancellationException) {
        throw e
    } catch (e: Throwable) {
        Result.failure(e)
    }
```

## Safe To Use For Non-Suspending Code

`runCatching` is perfectly fine around plain, non-suspending blocks (parsing, I/O without coroutines) where `CancellationException` can never occur.

```kotlin
fun parseIntOrDefault(input: String, default: Int): Int =
    runCatching { input.toInt() }.getOrDefault(default)
```

## See Also

- [`async-cancellation-cooperation`](async-cancellation-cooperation.md) - why cancellation must always propagate
- [`anti-runcatching-swallow-cancellation`](anti-runcatching-swallow-cancellation.md) - the specific anti-pattern this rule targets
- [`err-kotlin-result-inline`](err-kotlin-result-inline.md) - general guidance on `Result<T>` usage
- [`err-no-catch-generic-exception`](err-no-catch-generic-exception.md) - the broader problem of catching too widely
