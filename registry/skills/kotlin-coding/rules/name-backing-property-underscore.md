# name-backing-property-underscore

> Use a leading-underscore backing property for a public read-only view

## Why It Matters

Exposing a mutable collection or `MutableStateFlow` directly lets any caller mutate internal state from outside the class, breaking encapsulation and causing hard-to-trace bugs. The underscore-prefixed backing property pattern keeps the mutable instance private while exposing an immutable/read-only view under the clean public name, which is the idiomatic Kotlin way to enforce one-way mutation.

## Bad

```kotlin
class UserListViewModel {
    // Callers outside the class can push to this directly
    val users = MutableStateFlow<List<User>>(emptyList())

    fun refresh() {
        users.value = repository.fetchAll()
    }
}

external.users.value = emptyList() // oops, external code can wipe state
```

## Good

```kotlin
class UserListViewModel {
    private val _users = MutableStateFlow<List<User>>(emptyList())
    val users: StateFlow<List<User>> = _users.asStateFlow()

    fun refresh() {
        _users.value = repository.fetchAll()
    }
}

// external.users is read-only; only the ViewModel can mutate it
```

## Beyond StateFlow

```kotlin
class TagRepository {
    private val _tags = mutableListOf<String>()
    val tags: List<String> get() = _tags

    fun add(tag: String) {
        _tags += tag
    }
}
```

The same pattern applies to any mutable collection, `MutableList`, `MutableSet`, or `MutableSharedFlow` that a class owns but shouldn't let outsiders mutate directly.

## Ktlint/Detekt Rule

`detekt`'s `naming.BackingPropertyNaming` explicitly allow-lists the `_name`/`name` pairing so it doesn't flag the underscore as a naming violation:

```yaml
naming:
  BackingPropertyNaming:
    active: true
```

## See Also

- [`flow-stateflow-ui-state`](flow-stateflow-ui-state.md) - the most common use case for this pattern
- [`api-visibility-internal`](api-visibility-internal.md) - broader encapsulation guidance
- [`anti-mutable-public-collections`](anti-mutable-public-collections.md) - the anti-pattern this rule prevents
