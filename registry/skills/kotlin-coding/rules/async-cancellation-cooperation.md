# async-cancellation-cooperation

> Cooperate with cancellation by calling suspend functions or checking `isActive`

## Why It Matters

Coroutine cancellation is cooperative, not preemptive: cancelling a `Job` only sets a flag and throws `CancellationException` at the next suspension point. Code that never suspends and never checks its own status will keep running to completion regardless of cancellation, wasting resources and delaying shutdown or timeout handling.

## Bad

```kotlin
suspend fun bad(items: List<Item>) {
    var processed = 0
    // BAD: tight CPU loop with no suspension point and no isActive check
    for (item in items) {
        processed += heavyCompute(item)
    }
    println("Processed: $processed")
}
```

## Good

```kotlin
suspend fun good(items: List<Item>) = coroutineScope {
    var processed = 0
    for (item in items) {
        if (!isActive) return@coroutineScope // bail out promptly when cancelled
        processed += heavyCompute(item)
    }
    println("Processed: $processed")
}

// Or let ensureActive() throw automatically instead of manually branching
suspend fun goodStrict(items: List<Item>) {
    var processed = 0
    for (item in items) {
        currentCoroutineContext().ensureActive()
        processed += heavyCompute(item)
    }
    println("Processed: $processed")
}
```

## Suspend Functions Already Check

Calling any standard suspending function (`delay`, `yield`, a suspending channel operation) is itself a cancellation point — no extra check is needed around them:

```kotlin
suspend fun poll() {
    while (true) {
        delay(500) // throws CancellationException here if cancelled
        checkStatus()
    }
}
```

## isActive vs ensureActive vs yield

- `isActive`: a boolean you check to decide whether to exit gracefully (e.g. return partial results).
- `ensureActive()`: throws immediately if cancelled — use when there's nothing useful to clean up manually.
- `yield()`: suspends briefly, giving other coroutines a chance to run, and also throws if cancelled — useful in CPU loops that need fairness, not just cancellation checks.

```kotlin
suspend fun fairLoop(n: Int) {
    repeat(n) {
        yield() // cooperative: check cancellation AND let other coroutines run
        computeStep(it)
    }
}
```

## See Also

- [`async-suspend-fun-design`](async-suspend-fun-design.md) - designing functions around this contract
- [`async-avoid-blocking-calls`](async-avoid-blocking-calls.md) - blocking calls defeat cancellation entirely
- [`test-testdispatcher-virtual-time`](test-testdispatcher-virtual-time.md) - testing cancellation behavior
