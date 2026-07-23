# api-copy-with-defaults

> Use `data class` `copy()` for immutable partial updates

## Why It Matters

Manually reconstructing an immutable object to change one field means repeating every other field, which is verbose and creates a maintenance hazard: adding a new field means updating every hand-written "update" call site or silently dropping data. `copy()` generates a partial-update constructor automatically, so updates stay correct as the class evolves.

## Bad

```kotlin
data class UserPreferences(
    val theme: String,
    val fontSize: Int,
    val notificationsEnabled: Boolean,
    val language: String,
)

fun withDarkTheme(prefs: UserPreferences): UserPreferences =
    UserPreferences(
        theme = "dark",
        fontSize = prefs.fontSize,
        notificationsEnabled = prefs.notificationsEnabled,
        language = prefs.language,
    )
// Adding a field to UserPreferences means finding and fixing every function like this
```

## Good

```kotlin
data class UserPreferences(
    val theme: String,
    val fontSize: Int,
    val notificationsEnabled: Boolean,
    val language: String,
)

fun withDarkTheme(prefs: UserPreferences): UserPreferences = prefs.copy(theme = "dark")

// Chaining multiple partial updates
val updated = prefs
    .copy(fontSize = prefs.fontSize + 2)
    .copy(notificationsEnabled = false)
```

## Nested Immutable Updates

```kotlin
data class Address(val city: String, val zip: String)
data class User(val name: String, val address: Address)

fun relocate(user: User, newCity: String): User =
    user.copy(address = user.address.copy(city = newCity))
// copy() composes cleanly for nested structures without a lens library,
// though deeply nested trees may still benefit from Arrow Optics `copy` DSLs.
```

## Caveat: `copy()` Is Shallow

```kotlin
data class Team(val members: MutableList<String>)

val teamA = Team(mutableListOf("Alice"))
val teamB = teamA.copy()          // new Team, but same MutableList instance!
teamB.members.add("Bob")
println(teamA.members)            // [Alice, Bob] - mutation leaked through the "copy"

// Fix: use immutable collections so copy() truly isolates state
data class TeamFixed(val members: List<String>)
```

## See Also

- [`api-data-class-equality`](api-data-class-equality.md) - `copy()` is generated alongside `equals`/`hashCode`
- [`fn-immutable-collection-types`](fn-immutable-collection-types.md) - avoid the shallow-copy trap by using immutable collection types
- [`fn-val-over-var`](fn-val-over-var.md) - `copy()` supports the val-based immutable-update style
