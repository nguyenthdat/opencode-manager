# async-dispatchers-choice

> Choose `Dispatchers.Default`/`IO`/`Main` deliberately for the workload

## Why It Matters

Running CPU-bound work on `Dispatchers.IO` can exhaust its large thread pool without benefit, while running blocking I/O on `Dispatchers.Default` starves the limited pool of CPU cores that other computation needs. Picking the wrong dispatcher silently degrades throughput and can make an app or service unresponsive under load in ways that are hard to diagnose after the fact.

## Bad

```kotlin
suspend fun bad(users: List<User>): List<Score> = withContext(Dispatchers.IO) {
    // BAD: CPU-bound work on the IO dispatcher steals threads meant for blocking calls
    users.map { computeExpensiveScore(it) }
}

suspend fun badReversed(fileName: String): String = withContext(Dispatchers.Default) {
    // BAD: blocking file I/O on the Default dispatcher starves CPU-bound coroutines
    File(fileName).readText()
}
```

## Good

```kotlin
suspend fun good(users: List<User>): List<Score> = withContext(Dispatchers.Default) {
    // CPU-bound: bounded pool sized to available cores
    users.map { computeExpensiveScore(it) }
}

suspend fun goodReversed(fileName: String): String = withContext(Dispatchers.IO) {
    // Blocking I/O: elastic pool designed for threads that mostly wait
    File(fileName).readText()
}

suspend fun updateUi(state: UiState) = withContext(Dispatchers.Main) {
    // UI-affinity work: must run on the main/UI thread
    renderer.render(state)
}
```

## Choosing a Dispatcher

| Dispatcher | Use for | Backing |
|---|---|---|
| `Dispatchers.Default` | CPU-bound computation (parsing, sorting, image processing) | Fixed pool, sized to CPU cores |
| `Dispatchers.IO` | Blocking I/O (file, JDBC, blocking network clients) | Elastic pool, many more threads than cores |
| `Dispatchers.Main` | UI updates, platform main-thread affinity | Single UI thread (Android/Swing/JavaFX) |
| `Dispatchers.Unconfined` | Rare; testing or interceptors that don't need thread confinement | No thread pool of its own |

Non-blocking, suspend-only network calls (Ktor client, gRPC-Kotlin) need no dispatcher switch at all — they suspend without occupying a thread, so wrapping them in `withContext(Dispatchers.IO)` is unnecessary overhead.

## See Also

- [`async-withcontext-switch`](async-withcontext-switch.md) - how to actually switch dispatchers
- [`async-avoid-blocking-calls`](async-avoid-blocking-calls.md) - what happens when the wrong dispatcher is used
- [`perf-coroutine-dispatcher-overhead`](perf-coroutine-dispatcher-overhead.md) - cost of unnecessary switches
- [`async-suspend-fun-design`](async-suspend-fun-design.md) - keeping suspend functions main-safe regardless of caller
