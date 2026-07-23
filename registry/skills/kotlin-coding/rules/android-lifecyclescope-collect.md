# android-lifecyclescope-collect

> Collect flows with `lifecycleScope`/`repeatOnLifecycle`, not raw `GlobalScope`

## Why It Matters

Collecting a Flow with `GlobalScope.launch` (or any scope outliving the UI) keeps the collector running after the Activity/Fragment is destroyed, leaking the view and doing wasted work. `lifecycleScope` ties collection to the component's lifecycle, and `repeatOnLifecycle` additionally pauses/resumes collection around STOP/START to avoid missed or wasted emissions.

## Bad

```kotlin
class UserFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        GlobalScope.launch { // survives fragment destruction - leaks the view, can crash on late UI updates
            viewModel.uiState.collect { state -> render(state) }
        }
    }
}
```

## Good

```kotlin
class UserFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state -> render(state) } // stops below STARTED, restarts automatically
            }
        }
    }
}
```

## In Compose

```kotlin
@Composable
fun UserScreen(viewModel: UserViewModel) {
    val state by viewModel.uiState.collectAsStateWithLifecycle() // wraps repeatOnLifecycle internally
    UserContent(state)
}
```

## See Also

- [`android-flow-repeatonlifecycle`](android-flow-repeatonlifecycle.md) - the mechanism behind lifecycle-safe collection
- [`async-no-globalscope`](async-no-globalscope.md) - the anti-pattern this rule avoids
- [`flow-statein-sharein`](flow-statein-sharein.md) - sharing a flow across multiple lifecycle-aware collectors
- [`android-viewmodel-scope`](android-viewmodel-scope.md) - the equivalent scoping discipline on the ViewModel side
