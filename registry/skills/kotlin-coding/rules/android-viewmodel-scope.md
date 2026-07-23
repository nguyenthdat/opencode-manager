# android-viewmodel-scope

> Launch coroutines in `viewModelScope`, not a manually created scope

## Why It Matters

`viewModelScope` is automatically cancelled when the ViewModel is cleared, preventing leaked coroutines that keep running after the screen is gone. A manually created `CoroutineScope` must be cancelled by hand and is easy to forget, leaking work and holding references to the ViewModel and its dependencies.

## Bad

```kotlin
class UserViewModel : ViewModel() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main) // never cancelled automatically

    fun loadUser(id: String) {
        scope.launch {
            val user = repository.fetchUser(id) // keeps running even after the ViewModel is cleared
            _uiState.value = UiState.Loaded(user)
        }
    }
}
```

## Good

```kotlin
class UserViewModel(private val repository: UserRepository) : ViewModel() {
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    fun loadUser(id: String) {
        viewModelScope.launch { // cancelled automatically in onCleared()
            val user = repository.fetchUser(id)
            _uiState.value = UiState.Loaded(user)
        }
    }
}
```

## Custom Cleanup With viewModelScope

```kotlin
class SyncViewModel : ViewModel() {
    init {
        viewModelScope.launch {
            // any structured child coroutines launched here are cancelled together with the parent
        }
    }
}
```

## See Also

- [`async-structured-concurrency`](async-structured-concurrency.md) - the structured-concurrency principle behind lifecycle-scoped launches
- [`async-no-globalscope`](async-no-globalscope.md) - the anti-pattern `viewModelScope` avoids
- [`android-lifecyclescope-collect`](android-lifecyclescope-collect.md) - the equivalent pattern for UI-layer flow collection
- [`android-savedstatehandle-viewmodel`](android-savedstatehandle-viewmodel.md) - persisting ViewModel state beyond process death
