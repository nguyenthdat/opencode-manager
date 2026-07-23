# anti-runcatching-swallow-cancellation

> Don't let `runCatching` silently swallow `CancellationException`

## Why It Matters

`runCatching` catches `Throwable`, and `CancellationException` is a `Throwable` — so wrapping suspending code in `runCatching` without rethrowing cancellation breaks structured concurrency: the coroutine looks like it "succeeded with a Failure" instead of actually stopping, parent scopes don't learn their child was cancelled, and cancelled work keeps running past the point it should have stopped, wasting resources or racing with cleanup.

## Bad

```kotlin
suspend fun fetchUser(id: String): Result<User> {
    return runCatching {
        httpClient.get("/users/$id") // suspends
    }
    // If the coroutine is cancelled while suspended here, runCatching
    // catches the CancellationException and returns Result.failure(...)
    // instead of letting cancellation propagate - the coroutine never
    // actually stops, and the parent scope thinks it merely "failed"
}

suspend fun processAll(scope: CoroutineScope, ids: List<String>) {
    ids.map { id ->
        scope.async { fetchUser(id) }
    }.awaitAll() // cancelling this scope no longer reliably stops fetchUser
}
```

## Good

```kotlin
suspend fun fetchUser(id: String): Result<User> {
    return runCatching {
        httpClient.get("/users/$id")
    }.onFailure { e ->
        if (e is CancellationException) throw e // rethrow, don't swallow
    }
}

// Or use kotlinx.coroutines' cancellation-aware helper directly:
suspend fun fetchUserSafe(id: String): Result<User> = try {
    Result.success(httpClient.get("/users/$id"))
} catch (e: CancellationException) {
    throw e // structured concurrency requires this to propagate
} catch (e: Exception) {
    Result.failure(e)
}
```

## When It's Still Sometimes Seen

`runCatching` around genuinely non-suspending, non-cancellable code (pure CPU-bound parsing with no suspension points) has no cancellation to swallow, so the bare form is harmless there:

```kotlin
fun parseConfig(raw: String): Result<Config> =
    runCatching { Json.decodeFromString<Config>(raw) } // no suspend call inside, no risk
```

## See Also

- [`async-cancellation-cooperation`](async-cancellation-cooperation.md) - the cooperative cancellation model this anti-pattern breaks
- [`err-runcatching-pitfalls`](err-runcatching-pitfalls.md) - the positive-framed rule covering `runCatching` hazards generally
- [`flow-catch-operator`](flow-catch-operator.md) - the Flow equivalent of this same cancellation hazard
