# name-no-hungarian-notation

> Avoid Hungarian notation and type-suffix cruft in identifier names

## Why It Matters

Kotlin's strong static typing and IDE tooling make type-in-name prefixes/suffixes (`strName`, `mUserList`, `iCount`) redundant information that the compiler and editor already surface via inline type hints and hover. The cruft actively hurts renaming/refactoring (a `List` renamed to a `Set` leaves a stale `List` suffix lying around) and adds visual noise to every call site.

## Bad

```kotlin
class UserViewModel {
    private var mUserList: MutableList<User> = mutableListOf()
    private val strTag = "UserViewModel"

    fun updateUserList(newUserList: List<User>) {
        mUserList.clear()
        mUserList.addAll(newUserList)
    }
}

val iRetryCount = 3
val bIsLoading = false
```

## Good

```kotlin
class UserViewModel {
    private var users: MutableList<User> = mutableListOf()
    private val tag = "UserViewModel"

    fun updateUsers(newUsers: List<User>) {
        users.clear()
        users.addAll(newUsers)
    }
}

val retryCount = 3
val isLoading = false
```

## When a Suffix Genuinely Adds Meaning

```kotlin
// Acceptable: "Ms" clarifies a unit, not a type
val timeoutMs: Long = 30_000

// Acceptable: distinguishing a DTO from its domain equivalent by suffix
data class UserDto(val id: String, val name: String)
data class User(val id: UserId, val name: String)
```

A suffix is fine when it encodes domain meaning (units, DTO vs. domain model) rather than restating the declared type — `timeoutMs: Long` tells you the unit the compiler can't; `strTimeout: String` tells you nothing the type annotation doesn't already say.

## Ktlint/Detekt Rule

There's no single automated check for Hungarian notation broadly, but detekt's `style.VariableNaming` combined with a custom `ForbiddenIdentifier`-style rule (or code review checklist) is the usual enforcement mechanism.

## See Also

- [`name-functions-camel`](name-functions-camel.md) - the baseline casing this rule assumes
- [`name-boolean-is-has`](name-boolean-is-has.md) - the correct way to signal a boolean's meaning
- [`type-platform-type-annotate`](type-platform-type-annotate.md) - relying on explicit types instead of name cues
