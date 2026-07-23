# async-avoid-blocking-calls

> Never run blocking I/O or CPU work on a coroutine without `withContext(Dispatchers.IO)`

## Why It Matters

Coroutines are cooperative: a blocking call inside one occupies its underlying thread entirely, preventing that thread from resuming any other coroutine scheduled on it. On dispatchers with a small, fixed thread pool (like `Dispatchers.Default` or a UI dispatcher), a single blocking call can stall unrelated work across the whole application.

## Bad

```kotlin
suspend fun fetchAndSave(url: String) {
    // BAD: blocking network call directly on the caller's dispatcher
    val response = httpClient.executeBlocking(url) // e.g. OkHttp Call.execute()

    // BAD: blocking Thread.sleep inside a coroutine
    Thread.sleep(1_000)

    // BAD: blocking file write on whatever dispatcher this suspend fun was called from
    File("cache.json").writeText(response.body)
}
```

## Good

```kotlin
suspend fun fetchAndSave(url: String) {
    val response = withContext(Dispatchers.IO) {
        httpClient.executeBlocking(url)
    }

    delay(1_000) // suspends instead of blocking the thread

    withContext(Dispatchers.IO) {
        File("cache.json").writeText(response.body)
    }
}
```

## Prefer Genuinely Suspending APIs

The best fix is often not `withContext` at all, but a non-blocking client that suspends without occupying a thread:

```kotlin
// Ktor's HttpClient suspends natively - no dispatcher switch needed
suspend fun fetch(url: String): String = httpClient.get(url).bodyAsText()
```

## Detecting Violations

`kotlinx-coroutines-debug`'s `BlockHound` integration can catch blocking calls made from non-blocking dispatchers at runtime in tests or staging:

```kotlin
BlockHound.install()
```

## Detekt Rule

```yaml
coroutines:
  InjectDispatcher:
    active: true
  SleepInsteadOfDelay:
    active: true
```

## See Also

- [`async-dispatchers-choice`](async-dispatchers-choice.md) - which dispatcher blocking work belongs on
- [`async-withcontext-switch`](async-withcontext-switch.md) - the mechanism for the switch
- [`anti-blocking-in-coroutine`](anti-blocking-in-coroutine.md) - anti-pattern reference
- [`perf-coroutine-dispatcher-overhead`](perf-coroutine-dispatcher-overhead.md) - cost considerations of switching
