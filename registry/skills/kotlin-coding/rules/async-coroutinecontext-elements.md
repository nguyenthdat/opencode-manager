# async-coroutinecontext-elements

> Use `CoroutineContext` elements like `CoroutineName` for structured diagnostics

## Why It Matters

When dozens of coroutines run concurrently across dispatchers, a bare stack trace or thread dump gives no indication of which logical operation a given coroutine belongs to. Attaching a `CoroutineName` (and custom `CoroutineContext.Element`s for request IDs, trace IDs, etc.) turns opaque "DefaultDispatcher-worker-3" threads into diagnosable, traceable units of work.

## Bad

```kotlin
suspend fun handleRequest(request: Request) = coroutineScope {
    // BAD: no name - a thread dump or debugger shows only anonymous coroutines
    launch { validate(request) }
    launch { persist(request) }
}
```

## Good

```kotlin
suspend fun handleRequest(request: Request) = coroutineScope {
    launch(CoroutineName("validate-${request.id}")) { validate(request) }
    launch(CoroutineName("persist-${request.id}")) { persist(request) }
}
```

Enable coroutine debugging to see names in stack traces and the `kotlinx-coroutines-debug` dumper:

```kotlin
// JVM flag or system property, typically set for local dev / CI
// -Dkotlinx.coroutines.debug=on
```

## Custom Context Elements for Request-Scoped Data

```kotlin
class RequestId(val value: String) : AbstractCoroutineContextElement(RequestId) {
    companion object Key : CoroutineContext.Key<RequestId>
}

suspend fun logWithRequestId(message: String) {
    val id = currentCoroutineContext()[RequestId]?.value ?: "unknown"
    log.info("[$id] $message")
}

suspend fun handle(request: Request) = withContext(RequestId(request.id)) {
    logWithRequestId("handling request") // automatically tagged, propagates to all children
}
```

Context elements propagate automatically to every child coroutine launched within that context, which makes them a clean way to thread request/trace IDs through structured concurrency without passing an explicit parameter everywhere.

## See Also

- [`async-structured-concurrency`](async-structured-concurrency.md) - context propagation follows the same structure
- [`async-coroutineexceptionhandler`](async-coroutineexceptionhandler.md) - another context element installed at the root
- [`doc-inline-why-not-what`](doc-inline-why-not-what.md) - documenting intent alongside diagnostic naming
