# doc-deprecated-replacewith

> Pair `@Deprecated` with `ReplaceWith` for an automatic migration

## Why It Matters

A bare `@Deprecated("use newMethod instead")` tells a caller what to do but not how, forcing every consumer to manually rewrite call sites by hand across a whole codebase. `ReplaceWith` gives the IDE (and `kotlinc`'s deprecation-replacement tooling) enough information to offer a one-click "Replace with..." quick-fix, or even run an automated batch migration, turning a deprecation notice into a near-free migration.

## Bad

```kotlin
@Deprecated("Use fetchUser(id) instead, this overload doesn't set includeDeleted")
fun fetchUser(id: String, legacy: Boolean): User {
    return fetchUser(id, includeDeleted = legacy)
}
```

## Good

```kotlin
@Deprecated(
    message = "Use fetchUser(id, includeDeleted) for explicit deleted-record handling",
    replaceWith = ReplaceWith("fetchUser(id, includeDeleted = legacy)"),
    level = DeprecationLevel.WARNING,
)
fun fetchUser(id: String, legacy: Boolean): User {
    return fetchUser(id, includeDeleted = legacy)
}

fun fetchUser(id: String, includeDeleted: Boolean): User {
    // ...
}
```

## Deprecation Levels Over Time

```kotlin
// Step 1: warn, but keep working, with an auto-fix available
@Deprecated("Renamed to totalPriceCents", ReplaceWith("totalPriceCents"), DeprecationLevel.WARNING)
val totalPrice: Int get() = totalPriceCents

// Step 2 (next major version): fails to compile unless migrated, still offers the auto-fix
@Deprecated("Renamed to totalPriceCents", ReplaceWith("totalPriceCents"), DeprecationLevel.ERROR)
val totalPrice: Int get() = totalPriceCents

// Step 3 (following major version): fully removed
```

Ramping `WARNING` -> `ERROR` -> removal across major versions gives consumers a real migration window while `ReplaceWith` keeps the actual manual effort near zero at every step.

## Imports in ReplaceWith

```kotlin
@Deprecated(
    "Use kotlinx.datetime.Clock instead",
    ReplaceWith("Clock.System.now()", "kotlinx.datetime.Clock"),
)
fun currentTimeMillis(): Long = System.currentTimeMillis()
```

`ReplaceWith`'s second parameter accepts import strings so the IDE-applied fix also adds any newly required imports automatically.

## See Also

- [`doc-kdoc-public-api`](doc-kdoc-public-api.md) - documenting the replacement API being migrated to
- [`api-default-params-over-overloads`](api-default-params-over-overloads.md) - avoiding the overload proliferation that often leads to deprecation
- [`lint-compiler-warnings-as-errors`](lint-compiler-warnings-as-errors.md) - treating deprecation warnings as build-breaking once ready
