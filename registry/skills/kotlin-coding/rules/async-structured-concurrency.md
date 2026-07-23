# async-structured-concurrency

> Follow structured concurrency: every coroutine has an owning scope

## Why It Matters

Coroutines launched without a clear parent scope can outlive the component that started them, leaking work, holding references, and making cancellation impossible to reason about. Structured concurrency guarantees that a scope cannot complete until all its children finish, so errors propagate up and cleanup is automatic instead of relying on manual bookkeeping.

## Bad

```kotlin
class OrderProcessor {
    fun processOrders(orders: List<Order>) {
        // BAD: launched with no owning scope, nothing tracks or cancels these
        for (order in orders) {
            CoroutineScope(Dispatchers.IO).launch {
                submit(order)
            }
        }
    }

    private suspend fun submit(order: Order) { /* ... */ }
}
```

## Good

```kotlin
class OrderProcessor(
    private val scope: CoroutineScope,
) {
    fun processOrders(orders: List<Order>) {
        scope.launch {
            // coroutineScope ties children to this call; it won't return
            // until every submit() finishes or one fails and cancels the rest
            coroutineScope {
                orders.forEach { order ->
                    launch { submit(order) }
                }
            }
        }
    }

    private suspend fun submit(order: Order) { /* ... */ }
}
```

## The Structured Concurrency Contract

A coroutine builder (`launch`, `async`, `coroutineScope`) never returns to its caller before all coroutines it started have completed. This means:

- A parent cannot "finish early" while children are still running.
- Cancelling a parent cancels every descendant.
- An unhandled exception in a child propagates to the parent (unless using `SupervisorJob`), which then cancels its siblings.

```kotlin
suspend fun loadDashboard(userId: String): Dashboard = coroutineScope {
    val profile = async { fetchProfile(userId) }
    val orders = async { fetchOrders(userId) }
    // Both children are guaranteed to be done (or cancelled) before this returns
    Dashboard(profile.await(), orders.await())
}
```

## See Also

- [`async-coroutinescope-lifecycle`](async-coroutinescope-lifecycle.md) - tie scope lifetime to a component
- [`async-no-globalscope`](async-no-globalscope.md) - the most common violation of this rule
- [`async-coroutinescope-builder`](async-coroutinescope-builder.md) - the builders that enforce structure
- [`async-supervisorjob-isolation`](async-supervisorjob-isolation.md) - when siblings should not cancel each other
