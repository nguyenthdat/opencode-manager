# anti-globalscope-misuse

> Don't launch long-lived work on `GlobalScope`

## Why It Matters

`GlobalScope` coroutines live for the entire process lifetime and are never cancelled when the screen, request, or component that started them goes away, causing leaked work, wasted resources, and crashes when the leaked coroutine touches a now-destroyed view or closed connection. It also makes testing effectively impossible since there's no scope to cancel or await.

## Bad

```kotlin
class UserProfileViewModel {
    fun loadProfile(userId: String) {
        // Outlives the ViewModel - if the user navigates away, this keeps
        // running and may crash trying to update a destroyed view
        GlobalScope.launch {
            val profile = repository.fetchProfile(userId)
            updateUi(profile)
        }
    }
}

fun startPolling() {
    GlobalScope.launch {
        while (true) {
            poll()
            delay(5_000)
        }
    }
    // No way to stop this short of killing the process
}
```

## Good

```kotlin
class UserProfileViewModel(
    private val scope: CoroutineScope, // e.g. viewModelScope, cancelled with the ViewModel
) {
    fun loadProfile(userId: String) {
        scope.launch {
            val profile = repository.fetchProfile(userId)
            updateUi(profile)
        }
    }
}

class Poller(private val scope: CoroutineScope) {
    fun start() {
        scope.launch {
            while (isActive) {
                poll()
                delay(5_000)
            }
        }
    }
    // Caller cancels `scope` to stop polling deterministically
}
```

## When It's Still Sometimes Seen

```kotlin
// Fire-and-forget work that must survive the caller's own scope by design,
// e.g. flushing an analytics event queue before process death - still rare,
// and should be paired with a supervisor and explicit lifetime reasoning,
// not used as a default
@OptIn(DelicateCoroutinesApi::class)
fun flushAnalyticsOnShutdown() {
    GlobalScope.launch(SupervisorJob() + Dispatchers.IO) {
        analyticsQueue.flush()
    }
}
```

Kotlin marks `GlobalScope` with `@DelicateCoroutinesApi` precisely because it should require deliberate opt-in, not casual use.

## See Also

- [`async-no-globalscope`](async-no-globalscope.md) - the positive-framed rule this anti-pattern violates
- [`async-structured-concurrency`](async-structured-concurrency.md) - the structured-concurrency model `GlobalScope` bypasses
- [`async-coroutinescope-lifecycle`](async-coroutinescope-lifecycle.md) - tie coroutine lifetime to a real owner instead
