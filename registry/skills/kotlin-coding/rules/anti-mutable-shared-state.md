# anti-mutable-shared-state

> Don't mutate shared state from multiple coroutines without synchronization

## Why It Matters

Coroutines can run concurrently on multiple threads (with `Dispatchers.Default` or `IO`), so unsynchronized reads and writes to shared mutable state produce data races: lost updates, torn reads, and bugs that only appear under load and are nearly impossible to reproduce in a debugger. Kotlin gives no automatic protection here — a `var` is just as racy in a coroutine as in raw threads.

## Bad

```kotlin
class RequestCounter {
    var count = 0 // plain var, no synchronization

    suspend fun increment() = coroutineScope {
        repeat(1_000) {
            launch(Dispatchers.Default) {
                count++ // read-modify-write race - final count is unpredictable
            }
        }
    }
}

class Cache {
    private val map = HashMap<String, String>() // not thread-safe

    suspend fun put(key: String, value: String) = coroutineScope {
        launch(Dispatchers.IO) {
            map[key] = value // concurrent structural mutation can corrupt the map
        }
    }
}
```

## Good

```kotlin
class RequestCounter {
    private val count = atomic(0) // kotlinx.atomicfu, or java.util.concurrent.atomic

    suspend fun increment() = coroutineScope {
        repeat(1_000) {
            launch(Dispatchers.Default) {
                count.incrementAndGet()
            }
        }
    }
}

class Cache {
    private val mutex = Mutex()
    private val map = HashMap<String, String>()

    suspend fun put(key: String, value: String) {
        mutex.withLock { map[key] = value }
    }
}

// Or confine all mutation to a single coroutine/dispatcher and
// communicate via a Channel - no locking needed at all
```

## When It's Still Sometimes Seen

```kotlin
// Single-threaded confinement to Dispatchers.Main (or a single-threaded
// custom dispatcher) genuinely doesn't need a lock, because only one
// coroutine at a time can ever touch the state
class UiState {
    var counter = 0 // safe ONLY if every mutation happens on Dispatchers.Main
        private set
}
```

This is safe only as long as the confinement is airtight and documented — the moment any code path touches it from `Default` or `IO`, it's a race again.

## See Also

- [`async-mutex-over-synchronized`](async-mutex-over-synchronized.md) - the coroutine-aware synchronization primitive to reach for
- [`async-dispatchers-choice`](async-dispatchers-choice.md) - understand which dispatcher your code actually runs on
- [`anti-blocking-in-coroutine`](anti-blocking-in-coroutine.md) - a related coroutine-correctness pitfall
