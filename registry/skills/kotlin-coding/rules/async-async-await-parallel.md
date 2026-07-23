# async-async-await-parallel

> Use `async`/`await` for parallel decomposition of independent work

## Why It Matters

Sequentially awaiting independent suspend calls forces each one to wait for the previous one to finish even though nothing depends on it, multiplying total latency by the number of calls. `async` starts work concurrently and `await` collects results later, so independent operations overlap instead of serializing for no reason.

## Bad

```kotlin
suspend fun loadDashboard(userId: String): Dashboard {
    // BAD: sequential - total time is sum of all three calls
    val profile = fetchProfile(userId)
    val orders = fetchOrders(userId)
    val recommendations = fetchRecommendations(userId)
    return Dashboard(profile, orders, recommendations)
}
```

## Good

```kotlin
suspend fun loadDashboard(userId: String): Dashboard = coroutineScope {
    // GOOD: all three start immediately; total time is roughly the slowest one
    val profile = async { fetchProfile(userId) }
    val orders = async { fetchOrders(userId) }
    val recommendations = async { fetchRecommendations(userId) }
    Dashboard(profile.await(), orders.await(), recommendations.await())
}
```

## Fanning Out Over a Collection

```kotlin
suspend fun fetchAll(ids: List<String>): List<User> = coroutineScope {
    ids.map { id -> async { fetchUser(id) } }
       .awaitAll() // fails fast if any deferred throws, cancelling the rest
}
```

## Don't Reach for async When You Don't Need the Result Concurrently

If a value from one call feeds directly into the next, there is no independent work to parallelize — plain sequential `suspend` calls are simpler and clearer:

```kotlin
// No async needed: orders depends on the resolved user
suspend fun ordersForEmail(email: String): List<Order> {
    val user = findUserByEmail(email)
    return fetchOrders(user.id)
}
```

Also avoid creating an `async` and never calling `.await()` on it purely to run something "in the background" — that discards structured error propagation. Use `launch` instead when you don't need a return value.

## See Also

- [`async-structured-concurrency`](async-structured-concurrency.md) - why async must be launched inside a scope
- [`async-withcontext-switch`](async-withcontext-switch.md) - the alternative when there is no real concurrency
- [`async-coroutinescope-builder`](async-coroutinescope-builder.md) - coroutineScope as the enclosing builder
