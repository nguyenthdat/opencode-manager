# anti-blocking-in-coroutine

> Don't call blocking APIs inside a coroutine without switching dispatchers

## Why It Matters

Coroutine dispatchers like `Dispatchers.Default` and Android's main-safe dispatchers run a limited pool of threads shared by potentially thousands of coroutines; a single blocking call (`Thread.sleep`, a synchronous JDBC query, blocking file I/O) on one of those threads stalls every other coroutine queued behind it, causing latency spikes or full application stalls under load.

## Bad

```kotlin
suspend fun fetchAndSave(id: String) {
    val data = withContext(Dispatchers.Default) {
        // Blocking JDBC call on the Default dispatcher's limited CPU pool -
        // starves other CPU-bound coroutines waiting for a thread
        jdbcTemplate.queryForObject("SELECT * FROM users WHERE id = ?", id)
    }
    save(data)
}

suspend fun throttle() {
    Thread.sleep(1_000) // blocks the underlying thread, not just this coroutine
}
```

## Good

```kotlin
suspend fun fetchAndSave(id: String) {
    val data = withContext(Dispatchers.IO) { // IO dispatcher sized for blocking work
        jdbcTemplate.queryForObject("SELECT * FROM users WHERE id = ?", id)
    }
    save(data)
}

suspend fun throttle() {
    delay(1_000) // suspends the coroutine, frees the thread for other work
}
```

## When It's Still Sometimes Seen

A short, bounded blocking call inside `Dispatchers.IO` is the designed use case — `IO` is backed by a larger, elastic thread pool specifically to absorb blocking work:

```kotlin
suspend fun readFile(path: Path): String =
    withContext(Dispatchers.IO) {
        Files.readString(path) // blocking, but IO is sized to tolerate this
    }
```

The anti-pattern is specifically blocking on `Default`, `Main`, or a custom limited-parallelism dispatcher not intended for blocking work — not blocking calls in general.

## See Also

- [`async-avoid-blocking-calls`](async-avoid-blocking-calls.md) - the positive-framed rule this anti-pattern violates
- [`async-dispatchers-choice`](async-dispatchers-choice.md) - how to pick the right dispatcher for the work at hand
- [`async-withcontext-switch`](async-withcontext-switch.md) - the mechanism used to move blocking work off the wrong dispatcher
