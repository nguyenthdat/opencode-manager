# async-coroutinescope-builder

> Use the `coroutineScope`/`supervisorScope` builders for structured child launches

## Why It Matters

`coroutineScope` and `supervisorScope` are the tools that let a `suspend` function launch child coroutines while still behaving like an ordinary suspend function: the call doesn't return until all children complete, and failures propagate to the caller instead of leaking into an ambient scope. Skipping them in favor of an injected `CoroutineScope` for purely local, function-scoped concurrency breaks that guarantee.

## Bad

```kotlin
class ReportGenerator(private val scope: CoroutineScope) {
    // BAD: uses the injected, longer-lived scope for work local to this one call
    suspend fun generate(id: String): Report {
        val salesDeferred = scope.async { fetchSales(id) }
        val costsDeferred = scope.async { fetchCosts(id) }
        // If the caller of generate() is cancelled, these keep running under `scope`!
        return Report(salesDeferred.await(), costsDeferred.await())
    }
}
```

## Good

```kotlin
class ReportGenerator {
    // No injected scope needed at all for function-local concurrency
    suspend fun generate(id: String): Report = coroutineScope {
        val sales = async { fetchSales(id) }
        val costs = async { fetchCosts(id) }
        Report(sales.await(), costs.await())
    }
}
```

## coroutineScope vs supervisorScope

```kotlin
// coroutineScope: one child failing cancels its siblings and rethrows
suspend fun strict(): Result = coroutineScope {
    val a = async { partA() }
    val b = async { partB() } // cancelled if partA() throws
    Result(a.await(), b.await())
}

// supervisorScope: children fail independently; caller decides how to react
suspend fun lenient(): Results = supervisorScope {
    val a = async { runCatching { partA() } }
    val b = async { runCatching { partB() } } // still runs even if partA() failed
    Results(a.await(), b.await())
}
```

Reach for an injected, long-lived `CoroutineScope` only when the work must genuinely outlive the current call (e.g. fire-and-forget background refresh triggered by a UI event) — not as a substitute for these builders in ordinary request/response style suspend functions.

## See Also

- [`async-structured-concurrency`](async-structured-concurrency.md) - the guarantee these builders provide
- [`async-supervisorjob-isolation`](async-supervisorjob-isolation.md) - supervisorScope's failure isolation in depth
- [`async-async-await-parallel`](async-async-await-parallel.md) - typical usage inside these builders
