# android-sealed-ui-state

> Model screen UI state with a sealed class, not scattered boolean flags

## Why It Matters

Representing screen state as independent `isLoading`, `error: String?`, `data: List<Item>?` fields allows impossible combinations (loading=true *and* data non-null *and* error non-null) and forces every consumer to manually reason about which combination is valid. A sealed class makes illegal states unrepresentable and forces exhaustive `when` handling.

## Bad

```kotlin
data class UserScreenState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val error: String? = null,
) // nothing stops isLoading=true, user=non-null, error=non-null all at once
```

## Good

```kotlin
sealed interface UserScreenState {
    data object Loading : UserScreenState
    data class Loaded(val user: User) : UserScreenState
    data class Error(val message: String) : UserScreenState
}

@Composable
fun UserScreen(state: UserScreenState) {
    when (state) { // exhaustive - compiler enforces handling every case
        is UserScreenState.Loading -> LoadingSpinner()
        is UserScreenState.Loaded -> UserContent(state.user)
        is UserScreenState.Error -> ErrorMessage(state.message)
    }
}
```

## Combining With StateFlow

```kotlin
class UserViewModel(private val repo: UserRepository) : ViewModel() {
    private val _state = MutableStateFlow<UserScreenState>(UserScreenState.Loading)
    val state: StateFlow<UserScreenState> = _state.asStateFlow()

    fun load(id: String) {
        viewModelScope.launch {
            _state.value = runCatching { repo.fetchUser(id) }
                .fold(
                    onSuccess = { UserScreenState.Loaded(it) },
                    onFailure = { UserScreenState.Error(it.message ?: "Unknown error") },
                )
        }
    }
}
```

## See Also

- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - general sealed-class modeling guidance
- [`type-sealed-when-exhaustive`](type-sealed-when-exhaustive.md) - relying on exhaustive `when` for sealed types
- [`flow-stateflow-ui-state`](flow-stateflow-ui-state.md) - exposing this state as a `StateFlow`
- [`android-compose-state-hoisting`](android-compose-state-hoisting.md) - how this state flows into composables
