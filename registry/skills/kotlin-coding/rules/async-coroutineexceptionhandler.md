# async-coroutineexceptionhandler

> Install a `CoroutineExceptionHandler` on top-level scopes

## Why It Matters

An uncaught exception from a `launch`ed coroutine (as opposed to `async`, whose exceptions surface at `.await()`) has nowhere else to go — without a handler, it propagates to the thread's default uncaught exception handler, which on some platforms crashes the process and on others silently logs nothing useful. A `CoroutineExceptionHandler` on the top-level scope gives you one deliberate place to log, report, or recover.

## Bad

```kotlin
class BackgroundWorker {
    // BAD: no handler - an exception in any launch{} propagates uncontrolled
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    fun start() {
        scope.launch {
            riskyOperation() // if this throws, behavior is platform-dependent and unlogged
        }
    }
}
```

## Good

```kotlin
class BackgroundWorker {
    private val handler = CoroutineExceptionHandler { context, throwable ->
        log.error("Unhandled coroutine failure in ${context[CoroutineName]}", throwable)
        crashReporter.report(throwable)
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default + handler)

    fun start() {
        scope.launch {
            riskyOperation()
        }
    }
}
```

## Where It Applies (and Where It Doesn't)

`CoroutineExceptionHandler` only fires for uncaught exceptions from `launch` on a coroutine that has no parent with its own job (i.e. the top of a `SupervisorJob` tree), not for `async`'s deferred failures, and not for exceptions inside `coroutineScope`/`withContext` blocks, which always propagate to the caller instead.

```kotlin
// This handler is IGNORED - async failures surface at await(), not via the handler
scope.async(handler) {
    throw RuntimeException("lost until awaited")
}

// Correct: await() propagates the exception to the caller directly
val deferred = scope.async { riskyOperation() }
try {
    deferred.await()
} catch (e: Exception) {
    log.error("Deferred operation failed", e)
}
```

Install the handler once, on the root scope of an application or component — not on every individual `launch` call, which invites inconsistent handling.

## See Also

- [`async-supervisorjob-isolation`](async-supervisorjob-isolation.md) - isolating the failure that the handler reports
- [`async-coroutinescope-lifecycle`](async-coroutinescope-lifecycle.md) - where the root scope (and handler) lives
- [`err-custom-exception-hierarchy`](err-custom-exception-hierarchy.md) - structuring what gets thrown in the first place
