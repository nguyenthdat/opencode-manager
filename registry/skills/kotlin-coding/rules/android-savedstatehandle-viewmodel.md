# android-savedstatehandle-viewmodel

> Persist process-death-survivable state via `SavedStateHandle`

## Why It Matters

A plain ViewModel property survives configuration changes (like rotation) but is lost when the system kills the process in the background under memory pressure. `SavedStateHandle` persists small pieces of UI state — like a search query or scroll position — across process death, restoring them when the user returns.

## Bad

```kotlin
class SearchViewModel : ViewModel() {
    var query: String = "" // survives rotation, but lost if the process is killed in the background
}
```

## Good

```kotlin
class SearchViewModel(private val savedStateHandle: SavedStateHandle) : ViewModel() {
    var query: String
        get() = savedStateHandle["query"] ?: ""
        set(value) { savedStateHandle["query"] = value } // persisted across process death

    // Or expose it reactively:
    val queryFlow: StateFlow<String> = savedStateHandle.getStateFlow("query", "")
}
```

## Wiring It Up

```kotlin
class SearchFragment : Fragment() {
    private val viewModel: SearchViewModel by viewModels() // SavedStateHandle is provided automatically
}
```

## See Also

- [`android-viewmodel-scope`](android-viewmodel-scope.md) - the coroutine-lifecycle counterpart to this state-persistence rule
- [`android-parcelize-data-class`](android-parcelize-data-class.md) - making complex saved values `Parcelable`-compatible
- [`flow-stateflow-ui-state`](flow-stateflow-ui-state.md) - exposing `SavedStateHandle` values reactively
