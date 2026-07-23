# name-enum-entries-screaming-or-pascal

> Pick one enum-entry casing convention and apply it consistently

## Why It Matters

The Kotlin standard library and community are split between `SCREAMING_SNAKE_CASE` (matching Java's enum convention) and `PascalCase` (matching Kotlin's general type-member convention) for enum entries; either is acceptable, but mixing them within the same enum — or across enums in the same codebase — creates visual noise and makes `when` blocks harder to skim.

## Bad

```kotlin
enum class OrderStatus {
    Pending,
    PROCESSING,
    shipped,
    Delivered,
}

enum class LogLevel { Debug, INFO, warning, ERROR }
```

## Good

```kotlin
// Option A: SCREAMING_SNAKE_CASE (matches java.time.DayOfWeek-style enums)
enum class OrderStatus {
    PENDING,
    PROCESSING,
    SHIPPED,
    DELIVERED,
}

// Option B: PascalCase (matches Kotlin's own general member-naming convention)
enum class LogLevel { Debug, Info, Warning, Error }
```

## Picking One for Your Codebase

```kotlin
// detekt's default EnumNaming pattern accepts both; codify the choice in your style guide
// and configure detekt to only allow the chosen pattern:
enum class HttpMethod { GET, POST, PUT, DELETE, PATCH } // SCREAMING_SNAKE_CASE chosen project-wide
enum class NetworkState { Idle, Loading, Success, Error } // would fail the same detekt config
```

SCREAMING_SNAKE_CASE is the more common choice for enums that mirror a fixed protocol/spec value (HTTP methods, status codes), while PascalCase is common for enums that behave like small sealed hierarchies of UI/domain state — either is fine as long as the whole codebase agrees.

## Ktlint/Detekt Rule

```yaml
naming:
  EnumNaming:
    enumEntryPattern: '[A-Z][a-zA-Z0-9]*|[A-Z][A-Z0-9_]*'
```

Narrow `enumEntryPattern` to just one alternative (e.g. `'[A-Z][A-Z0-9_]*'`) once your team has picked a single convention, so detekt enforces consistency rather than merely allowing both.

## See Also

- [`name-classes-pascal`](name-classes-pascal.md) - PascalCase convention for the enum type itself
- [`name-constants-screaming-snake`](name-constants-screaming-snake.md) - the SCREAMING_SNAKE_CASE convention this borrows from
- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - sealed classes as an alternative to enums for richer state
