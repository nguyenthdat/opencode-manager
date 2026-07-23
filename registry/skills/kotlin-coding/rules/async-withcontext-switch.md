# async-withcontext-switch

> Use `withContext` to switch dispatchers, not to launch new coroutines

## Why It Matters

`withContext` suspends the current coroutine and resumes it on another dispatcher — it does not create a new coroutine, a new job, or a new scope. Using `launch`/`async` inside a function just to "switch threads" adds an unstructured child coroutine, forces you to remember to `.join()`/`.await()` it, and breaks the caller's ability to get a return value directly.

## Bad

```kotlin
suspend fun badLoad(id: String): User {
    lateinit var result: User
    // BAD: launching a coroutine just to change dispatcher, then blocking on it
    coroutineScope {
        launch(Dispatchers.IO) {
            result = database.findUser(id)
        }
    }
    return result
}
```

## Good

```kotlin
suspend fun goodLoad(id: String): User =
    withContext(Dispatchers.IO) {
        // withContext returns the block's result directly, no shared var needed
        database.findUser(id)
    }
```

## withContext Preserves Structure and Cancellation

`withContext` still participates in structured concurrency: it inherits the calling coroutine's `Job` as a child context element for cancellation, but does not create a new sibling that can outlive the call. If the caller is cancelled while suspended inside `withContext`, the block is cancelled too.

```kotlin
suspend fun readConfig(path: String): Config = withContext(Dispatchers.IO) {
    ensureActive() // cooperates with cancellation before the blocking read
    Json.decodeFromString(File(path).readText())
}
```

## When to Actually Use launch/async Instead

Use `launch`/`async` only when you need genuine concurrency — multiple independent operations running at the same time — not merely a dispatcher change for one sequential operation.

```kotlin
suspend fun loadBoth(id: String): Pair<User, List<Order>> = coroutineScope {
    val user = async(Dispatchers.IO) { database.findUser(id) }
    val orders = async(Dispatchers.IO) { database.findOrders(id) }
    user.await() to orders.await()
}
```

## See Also

- [`async-dispatchers-choice`](async-dispatchers-choice.md) - which dispatcher to switch to
- [`async-async-await-parallel`](async-async-await-parallel.md) - when concurrency, not just a switch, is needed
- [`async-suspend-fun-design`](async-suspend-fun-design.md) - designing the function withContext lives in
