# async-supervisorjob-isolation

> Use `SupervisorJob`/`supervisorScope` to isolate sibling coroutine failures

## Why It Matters

With a regular `Job`, a failure in any child cancels the parent and every other sibling — appropriate when children are truly dependent on each other, but disastrous when they are independent tasks (like handling separate client requests) that should fail in isolation. `SupervisorJob` and `supervisorScope` change that propagation so one failure doesn't take down unrelated work.

## Bad

```kotlin
class RequestHandler(scope: CoroutineScope) {
    private val handlerScope = scope // regular Job: one failure cancels all requests

    fun handle(requests: List<Request>) {
        handlerScope.launch {
            // BAD: if any single request throws, coroutineScope cancels ALL siblings
            coroutineScope {
                requests.forEach { req ->
                    launch { process(req) }
                }
            }
        }
    }
}
```

## Good

```kotlin
class RequestHandler(scope: CoroutineScope) {
    fun handle(requests: List<Request>) {
        scope.launch {
            // supervisorScope: one child's failure does not cancel its siblings
            supervisorScope {
                requests.forEach { req ->
                    launch {
                        try {
                            process(req)
                        } catch (e: CancellationException) {
                            throw e
                        } catch (e: Exception) {
                            log.error("Request ${req.id} failed", e)
                        }
                    }
                }
            }
        }
    }
}
```

## SupervisorJob for a Long-Lived Root Scope

```kotlin
class AppComponent {
    // SupervisorJob at the root: independent long-running children survive each other's failures
    private val job = SupervisorJob()
    val scope = CoroutineScope(job + Dispatchers.Default + exceptionHandler)

    fun start() {
        scope.launch { metricsReporter() }   // if this crashes...
        scope.launch { cacheEvictionLoop() } // ...this keeps running
    }
}
```

Each child launched directly under a `SupervisorJob`-backed scope still needs its own exception handling (a `CoroutineExceptionHandler` or an internal try/catch), because a `SupervisorJob` only stops failures from *propagating to siblings* — it does not swallow the exception itself.

## See Also

- [`async-structured-concurrency`](async-structured-concurrency.md) - the default propagation this rule overrides
- [`async-coroutineexceptionhandler`](async-coroutineexceptionhandler.md) - handling the isolated failure
- [`async-coroutinescope-builder`](async-coroutinescope-builder.md) - coroutineScope vs supervisorScope
