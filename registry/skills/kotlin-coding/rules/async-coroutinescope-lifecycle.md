# async-coroutinescope-lifecycle

> Tie a `CoroutineScope`'s lifetime to its owning component

## Why It Matters

A `CoroutineScope` that outlives its component (an Activity, a service, a repository) keeps launching or awaiting work after that component is gone, wasting resources and risking crashes from touching destroyed state. Binding the scope's `Job` to a lifecycle hook ensures cancellation happens exactly once, at the right time, without manual tracking of every launched coroutine.

## Bad

```kotlin
class SyncService {
    // BAD: scope has no defined end; nothing ever cancels it
    private val scope = CoroutineScope(Dispatchers.IO)

    fun start() {
        scope.launch { syncLoop() }
    }

    fun stop() {
        // Forgot to cancel scope.coroutineContext -> syncLoop keeps running forever
    }

    private suspend fun syncLoop() { /* ... */ }
}
```

## Good

```kotlin
class SyncService {
    private val job = SupervisorJob()
    private val scope = CoroutineScope(job + Dispatchers.IO)

    fun start() {
        scope.launch { syncLoop() }
    }

    fun stop() {
        job.cancel() // cancels every coroutine launched in this scope
    }

    private suspend fun syncLoop() { /* ... */ }
}
```

## Common Lifecycle Bindings

```kotlin
// Android ViewModel: use the built-in viewModelScope, cancelled automatically
class OrderViewModel : ViewModel() {
    fun load() {
        viewModelScope.launch { /* ... */ }
    }
}

// A custom closeable component implementing Closeable/AutoCloseable
class ConnectionPool : Closeable {
    private val job = SupervisorJob()
    private val scope = CoroutineScope(job + Dispatchers.IO)

    fun watch() = scope.launch { /* ... */ }

    override fun close() {
        job.cancel()
    }
}
```

Prefer exposing a scope only to code that owns the corresponding lifecycle. Passing a raw, unscoped `CoroutineScope` around invites callers to launch work nobody is responsible for cancelling.

## See Also

- [`async-structured-concurrency`](async-structured-concurrency.md) - the principle this rule implements
- [`async-no-globalscope`](async-no-globalscope.md) - the failure mode of an unbound scope
- [`android-viewmodel-scope`](android-viewmodel-scope.md) - the standard Android lifecycle binding
- [`async-supervisorjob-isolation`](async-supervisorjob-isolation.md) - why the root Job is usually a SupervisorJob
