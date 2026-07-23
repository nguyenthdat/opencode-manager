# api-sealed-for-state

> Model exhaustive state machines with `sealed class`/`sealed interface`

## Why It Matters

Using booleans, enums-with-nullable-fields, or string tags to represent state lets invalid combinations compile (e.g., `isLoading = true` with a non-null `error`). `sealed class`/`sealed interface` restricts the hierarchy to a known, closed set of subtypes, so the compiler can force exhaustive `when` handling and each state can carry only the data that's actually valid for it.

## Bad

```kotlin
data class UiState(
    val isLoading: Boolean = false,
    val data: List<Item>? = null,
    val error: String? = null,
)
// Nothing prevents isLoading = true, data = [...], error = "oops" all at once

fun render(state: UiState) {
    if (state.isLoading) showSpinner()
    if (state.error != null) showError(state.error)  // easy to forget the else
    if (state.data != null) showList(state.data)
}
```

## Good

```kotlin
sealed interface UiState {
    data object Loading : UiState
    data class Success(val data: List<Item>) : UiState
    data class Error(val message: String) : UiState
}

fun render(state: UiState) {
    when (state) {
        is UiState.Loading -> showSpinner()
        is UiState.Success -> showList(state.data)
        is UiState.Error -> showError(state.message)
    }
    // Compiler error if a new subtype is added and this `when` isn't updated
    // (when used as an expression, or with -Xexhaustive-when style checks enabled)
}
```

## Nested Hierarchies for Sub-States

```kotlin
sealed interface PaymentState {
    data object Idle : PaymentState
    data class Processing(val attempt: Int) : PaymentState

    sealed interface Failed : PaymentState {
        data object NetworkError : Failed
        data class Declined(val reason: String) : Failed
    }

    data class Completed(val receiptId: String) : PaymentState
}

fun describe(state: PaymentState): String = when (state) {
    PaymentState.Idle -> "idle"
    is PaymentState.Processing -> "processing (attempt ${state.attempt})"
    PaymentState.Failed.NetworkError -> "network error"
    is PaymentState.Failed.Declined -> "declined: ${state.reason}"
    is PaymentState.Completed -> "done: ${state.receiptId}"
}
```

## Evidence

Ktor's `HttpClientCall` internals and Arrow's `Either`/`Ior` both rely on sealed hierarchies to make illegal states unrepresentable. Android's official architecture guidance recommends sealed `UiState` classes for ViewModel state exposure precisely to avoid the boolean/nullable-field combinatorics shown above.

## See Also

- [`type-sealed-when-exhaustive`](type-sealed-when-exhaustive.md) - exhaustive `when` over sealed hierarchies
- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - designing sealed hierarchies
- [`type-data-object-singleton`](type-data-object-singleton.md) - use `data object` for singleton states
- [`android-sealed-ui-state`](android-sealed-ui-state.md) - applying sealed state to Android UI
