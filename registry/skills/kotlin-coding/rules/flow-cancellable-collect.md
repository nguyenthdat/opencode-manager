# flow-cancellable-collect

> Ensure `collect` runs inside a structured, cancellable scope

## Why It Matters

`collect` is a suspend function that runs for as long as the flow keeps emitting — if it's launched without a scope tied to a real lifecycle, it keeps collecting (and doing whatever work each emission triggers) long after the caller stops caring, leaking resources exactly like an unscoped `launch`. It needs to live inside structured concurrency just as much as any other suspending operation.

## Bad

```kotlin
class LocationTracker {
    // BAD: GlobalScope means this collection never stops, even after the tracker
    // is supposed to be done
    fun start() {
        GlobalScope.launch {
            locationUpdates().collect { loc -> broadcastLocation(loc) }
        }
    }
}
```

## Good

```kotlin
class LocationTracker(private val scope: CoroutineScope) {
    private var job: Job? = null

    fun start() {
        job = scope.launch {
            locationUpdates().collect { loc -> broadcastLocation(loc) }
        }
    }

    fun stop() {
        job?.cancel() // collect stops promptly; the flow is cancelled cooperatively
    }
}
```

## Android: repeatOnLifecycle

On Android, tie flow collection to the visible lifecycle state instead of the whole component's lifetime, so collection pauses automatically when the UI is backgrounded:

```kotlin
class LocationFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.locationUpdates.collect { loc -> updateMap(loc) }
            }
        }
    }
}
```

## Multiple Collectors Need Independent Structure

Each `collect` call is its own suspending operation; launching several in the same coroutine blocks on the first one forever, since `collect` never returns for an infinite flow. Launch each in its own child coroutine if truly independent, concurrent collection is required.

```kotlin
scope.launch {
    launch { flowA.collect { /* ... */ } }
    launch { flowB.collect { /* ... */ } } // runs concurrently with flowA's collection
}
```

## See Also

- [`async-structured-concurrency`](async-structured-concurrency.md) - the same principle applied to collect
- [`android-flow-repeatonlifecycle`](android-flow-repeatonlifecycle.md) - the Android-specific pattern shown above
- [`async-no-globalscope`](async-no-globalscope.md) - the anti-pattern this rule specifically guards against
