# type-data-object-singleton

> Use `data object` for singleton sealed variants

## Why It Matters

Plain `object` declarations inherit `Any`'s default `toString()` (something like `Foo@1a2b3c`), which makes logs and test failure diffs unreadable, and `object` equality is always reference equality even though a stateless singleton is conceptually a value. `data object` (stable since Kotlin 1.9) generates a readable `toString()` and a `hashCode()`/`equals()` consistent with other `data` types, without needing any properties to compare.

## Bad

```kotlin
sealed interface DownloadState {
    object Idle : DownloadState        // toString() = "DownloadState$Idle@4a574795"
    object Completed : DownloadState
    data class InProgress(val percent: Int) : DownloadState
    data class Failed(val error: Throwable) : DownloadState
}

fun log(state: DownloadState) {
    println("State changed: $state")  // Unreadable for Idle/Completed
}
```

## Good

```kotlin
sealed interface DownloadState {
    data object Idle : DownloadState        // toString() = "Idle"
    data object Completed : DownloadState   // toString() = "Completed"
    data class InProgress(val percent: Int) : DownloadState
    data class Failed(val error: Throwable) : DownloadState
}

fun log(state: DownloadState) {
    println("State changed: $state")  // "State changed: Idle"
}
```

## Equality And Serialization Benefits

```kotlin
data object NetworkUnavailable : DownloadState

// Useful in tests: readable assertion failures
assertEquals(DownloadState.Idle, actualState)
// Failure message shows "Idle" vs "InProgress(percent=40)", not hex addresses

// kotlinx.serialization treats data object like an empty data class
@Serializable
sealed interface ApiResult {
    @Serializable
    data object NotFound : ApiResult
}
```

## See Also

- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - the hierarchy `data object` variants typically belong to
- [`type-data-class-value`](type-data-class-value.md) - the non-singleton counterpart for variants with state
- [`type-sealed-when-exhaustive`](type-sealed-when-exhaustive.md) - exhaustive `when` handling for these singleton variants
