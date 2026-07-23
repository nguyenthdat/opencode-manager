# android-flow-repeatonlifecycle

> Restart flow collection safely with `repeatOnLifecycle`

## Why It Matters

Collecting a Flow directly in `onCreate`/`onStart` without lifecycle awareness either keeps collecting while the UI is stopped (wasting resources, risking crashes from updating a detached view) or, if collection is simply cancelled in `onStop` without restart logic, misses emissions after the UI resumes. `repeatOnLifecycle` cancels and restarts the block automatically at the given lifecycle state.

## Bad

```kotlin
class UserActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        lifecycleScope.launch {
            viewModel.uiState.collect { state -> // keeps collecting/updating views even while STOPPED
                render(state)
            }
        }
    }
}
```

## Good

```kotlin
class UserActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state -> // auto-cancelled on STOP, auto-restarted on START
                    render(state)
                }
            }
        }
    }
}
```

## Multiple Flows at Once

```kotlin
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        launch { viewModel.uiState.collect { render(it) } }
        launch { viewModel.events.collect { handleEvent(it) } } // both scoped to the same lifecycle window
    }
}
```

## See Also

- [`android-lifecyclescope-collect`](android-lifecyclescope-collect.md) - the broader pattern this mechanism implements
- [`flow-statein-sharein`](flow-statein-sharein.md) - sharing a flow across multiple lifecycle-aware collectors
- [`flow-cancellable-collect`](flow-cancellable-collect.md) - cooperative cancellation during collection
- [`async-structured-concurrency`](async-structured-concurrency.md) - the structured-concurrency principle underlying this API
