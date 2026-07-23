# async-mutex-over-synchronized

> Use `Mutex` instead of `synchronized`/JVM locks inside coroutines

## Why It Matters

`synchronized` blocks and JVM locks (`ReentrantLock`) block the underlying thread, and they are not suspend-aware — using them around a `suspend` call is either a compile error (you can't `.await()` inside `synchronized`) or, if you work around it, silently defeats coroutine scheduling by parking a whole thread. `kotlinx.coroutines.sync.Mutex` provides a suspending, non-blocking lock designed specifically for this.

## Bad

```kotlin
class Counter {
    private var value = 0

    // BAD: synchronized blocks the carrier thread; cannot contain suspend calls safely
    @Synchronized
    suspend fun increment() {
        value += 1
        publishToAnalytics(value) // won't even compile inside `synchronized`
    }
}
```

## Good

```kotlin
class Counter {
    private var value = 0
    private val mutex = Mutex()

    suspend fun increment() {
        mutex.withLock {
            value += 1
            publishToAnalytics(value) // suspending calls are fine here
        }
    }
}
```

## Mutex Is Not Reentrant

Unlike `synchronized`, `Mutex.lock()` deadlocks if the same coroutine tries to acquire it twice without releasing:

```kotlin
val mutex = Mutex()

suspend fun outer() = mutex.withLock {
    inner() // deadlocks: same coroutine re-entering the same Mutex
}

suspend fun inner() = mutex.withLock { /* ... */ }
```

Structure code to acquire the lock once per logical operation, or extract the inner logic into a private function that assumes the lock is already held.

## When synchronized/ReentrantLock Is Still Fine

Plain, short, non-suspending critical sections with no coroutine interaction at all (e.g. protecting a JVM-only cache accessed from both blocking and coroutine code) can keep using `synchronized`, since there's no `.await()` inside it and no coroutine scheduling to disrupt.

```kotlin
class LocalCache {
    private val lock = Any()
    private val map = HashMap<String, String>()

    fun get(key: String): String? = synchronized(lock) { map[key] } // no suspend calls, fine
}
```

## See Also

- [`async-avoid-blocking-calls`](async-avoid-blocking-calls.md) - blocking primitives inside coroutines generally
- [`async-cancellation-cooperation`](async-cancellation-cooperation.md) - Mutex.withLock is itself a cancellation point
- [`anti-mutable-shared-state`](anti-mutable-shared-state.md) - the shared state this rule usually protects
