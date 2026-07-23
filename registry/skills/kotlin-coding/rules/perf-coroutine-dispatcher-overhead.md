# perf-coroutine-dispatcher-overhead

> Avoid unnecessary dispatcher hops for cheap, non-blocking work

## Why It Matters

Every `withContext(Dispatchers.X)` call that actually switches threads pays a real cost — thread-pool scheduling, context object allocation, and potential cache-line migration — so wrapping a cheap, non-blocking computation in an unneeded dispatcher switch adds latency for no benefit.

## Bad

```kotlin
suspend fun formatUserLabel(user: User): String = withContext(Dispatchers.Default) {
    "${user.firstName} ${user.lastName}".trim() // trivial string work, doesn't need Default dispatcher
}

suspend fun loadAndFormat(id: String): String {
    val user = withContext(Dispatchers.IO) { userDao.find(id) }
    return withContext(Dispatchers.Default) { // unnecessary hop right after the IO hop
        formatUserLabel(user)
    }
}
```

## Good

```kotlin
fun formatUserLabel(user: User): String = // not even suspend - no dispatcher needed at all
    "${user.firstName} ${user.lastName}".trim()

suspend fun loadAndFormat(id: String): String {
    val user = withContext(Dispatchers.IO) { userDao.find(id) } // one hop for the actual blocking work
    return formatUserLabel(user) // runs on whatever dispatcher the caller already has
}
```

## When a Hop Is Justified

Switch dispatchers only around genuinely blocking or CPU-heavy work: `Dispatchers.IO` for blocking I/O, `Dispatchers.Default` for CPU-bound work over large data, `Dispatchers.Main` for UI updates. Don't wrap every suspend function in `withContext` "just in case" — let the call site's existing context decide.

## See Also

- [`async-dispatchers-choice`](async-dispatchers-choice.md) - which dispatcher to pick for a given workload
- [`async-withcontext-switch`](async-withcontext-switch.md) - correct use of `withContext` for context switching
- [`perf-profile-before-optimize`](perf-profile-before-optimize.md) - confirm the hop is actually costing something first
- [`android-viewmodel-scope`](android-viewmodel-scope.md) - typical place these unnecessary hops accumulate
