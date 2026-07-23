# android-compose-state-hoisting

> Hoist Compose state instead of holding mutable state inside composables

## Why It Matters

A composable that owns its own `mutableStateOf` is not reusable, not testable in isolation, and cannot be driven or observed by a parent. Hoisting state — passing `value` and `onValueChange` down — makes the composable stateless and lets a single source of truth (often a ViewModel) control it.

## Bad

```kotlin
@Composable
fun SearchBar() {
    var query by remember { mutableStateOf("") } // state trapped inside, parent can't read or control it

    TextField(
        value = query,
        onValueChange = { query = it },
    )
}
```

## Good

```kotlin
@Composable
fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
) {
    TextField(
        value = query,
        onValueChange = onQueryChange,
    ) // stateless, reusable, easy to preview and test
}

@Composable
fun SearchScreen(viewModel: SearchViewModel) {
    val query by viewModel.query.collectAsStateWithLifecycle()
    SearchBar(query = query, onQueryChange = viewModel::onQueryChanged)
}
```

## When Local State Is Fine

Purely presentational, ephemeral UI state that no other composable needs to read or drive (for example, whether a tooltip is currently expanded) can stay local with `remember { mutableStateOf(...) }`. Hoist only what needs to be shared, tested, or persisted.

## See Also

- [`android-sealed-ui-state`](android-sealed-ui-state.md) - modeling the hoisted state itself
- [`android-viewmodel-scope`](android-viewmodel-scope.md) - where hoisted state typically lives and updates
- [`flow-stateflow-ui-state`](flow-stateflow-ui-state.md) - exposing hoisted state as a `StateFlow` from a ViewModel
