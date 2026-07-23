# async-no-globalscope

> Avoid `GlobalScope`; launch from a scoped, cancellable context

## Why It Matters

`GlobalScope` lives for the entire process, so coroutines launched on it can never be cancelled by a caller, never propagate structured errors, and keep running (and consuming resources) after the component that started them is gone. It bypasses structured concurrency entirely, which is exactly the problem structured concurrency was designed to prevent.

## Bad

```kotlin
class NotificationSender {
    fun sendAsync(notification: Notification) {
        // BAD: no one can cancel this, and exceptions are lost or crash the process
        GlobalScope.launch {
            api.send(notification)
        }
    }
}
```

## Good

```kotlin
class NotificationSender(
    private val scope: CoroutineScope, // injected, tied to a real lifecycle
) {
    fun sendAsync(notification: Notification) {
        scope.launch {
            api.send(notification)
        }
    }
}

// Composition root wires the scope to something with a defined lifetime
val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
val sender = NotificationSender(appScope)
```

## When GlobalScope Is Acceptable

A small, explicit allowlist: truly application-scoped, fire-and-forget work that is intended to run for the entire process lifetime and is documented as such — e.g. a top-level `main()` bootstrap coroutine. Even then, prefer creating one explicit, named, process-scoped `CoroutineScope` (like `appScope` above) instead of `GlobalScope`, because the named scope can still be cancelled in tests and makes the intent visible at the call site.

```kotlin
// Acceptable only in library/framework bootstrap code, and still discouraged:
fun main() = runBlocking {
    // runBlocking itself provides structure for the process's lifetime
    launch { backgroundMetricsFlush() }
    awaitCancellation()
}
```

## Detekt Rule

The `coroutines` rule set in detekt flags this directly:

```yaml
coroutines:
  GlobalCoroutineUsage:
    active: true
```

## See Also

- [`async-structured-concurrency`](async-structured-concurrency.md) - the principle GlobalScope violates
- [`async-coroutinescope-lifecycle`](async-coroutinescope-lifecycle.md) - what to use instead
- [`anti-globalscope-misuse`](anti-globalscope-misuse.md) - anti-pattern reference
- [`lint-detekt-custom-rules`](lint-detekt-custom-rules.md) - enforcing this automatically
