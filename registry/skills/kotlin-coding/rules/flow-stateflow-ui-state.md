# flow-stateflow-ui-state

> Model observable state with `StateFlow`, not a mutable var

## Why It Matters

A plain mutable property exposed for observation requires hand-rolled listener plumbing and gives no guarantee that readers see updates consistently across threads. `StateFlow` gives you conflated, thread-safe, always-has-a-current-value state that any coroutine can `collect`, with built-in equality-based deduplication so identical consecutive values don't trigger redundant work.

## Bad

```kotlin
class SearchViewModel {
    // BAD: plain var - no observation mechanism, no thread safety, callers must poll
    var uiState: SearchUiState = SearchUiState.Idle
        private set

    fun onQueryChanged(query: String) {
        uiState = SearchUiState.Loading
        // nothing is notified that uiState changed
    }
}
```

## Good

```kotlin
class SearchViewModel(private val scope: CoroutineScope) {
    private val _uiState = MutableStateFlow<SearchUiState>(SearchUiState.Idle)
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()

    fun onQueryChanged(query: String) {
        _uiState.value = SearchUiState.Loading
        scope.launch {
            val results = repository.search(query)
            _uiState.value = SearchUiState.Loaded(results)
        }
    }
}

// Collector observes every update, and immediately gets the current value on subscribe
scope.launch {
    viewModel.uiState.collect { state -> render(state) }
}
```

## Private Mutable, Public Read-Only

Always expose the mutable backing property as read-only externally, via `asStateFlow()` (or a `StateFlow`-typed public property backed by a `MutableStateFlow`), so only the owning class can push new state.

```kotlin
sealed interface SearchUiState {
    data object Idle : SearchUiState
    data object Loading : SearchUiState
    data class Loaded(val results: List<Result>) : SearchUiState
}
```

`StateFlow` requires an initial value and always has a current one (`.value`), which is exactly the shape of UI state: there's always *something* to render, never a temporary absence of state.

## See Also

- [`flow-sharedflow-events`](flow-sharedflow-events.md) - the wrong tool when the emission is a one-off event, not durable state
- [`name-backing-property-underscore`](name-backing-property-underscore.md) - the `_uiState`/`uiState` naming convention used here
- [`android-sealed-ui-state`](android-sealed-ui-state.md) - modeling the state type itself
- [`flow-cold-vs-hot`](flow-cold-vs-hot.md) - why StateFlow behaves this way
