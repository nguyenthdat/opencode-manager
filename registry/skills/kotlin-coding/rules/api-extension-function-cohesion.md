# api-extension-function-cohesion

> Add focused extension functions instead of bloating a class

## Why It Matters

Every method added to a class widens its API surface and must be understood, tested, and maintained as part of that class forever, even if it's only used by one caller in one module. Extension functions let you attach behavior to a type from the outside, keeping the core class small and letting unrelated helpers live next to the code that actually needs them.

## Bad

```kotlin
class User(val id: String, val firstName: String, val lastName: String, val email: String) {
    // Formatting concern bolted directly onto the domain model
    fun toDisplayName(): String = "$firstName $lastName"

    // UI-only concern that has nothing to do with User's core responsibility
    fun toListItemHtml(): String = "<li>$firstName $lastName ($email)</li>"

    // Analytics concern, again unrelated to what a User *is*
    fun toAnalyticsProperties(): Map<String, String> =
        mapOf("user_id" to id, "email_domain" to email.substringAfter("@"))
}
```

## Good

```kotlin
// Core domain model stays minimal and focused
class User(val id: String, val firstName: String, val lastName: String, val email: String)

// Presentation layer owns display formatting
fun User.toDisplayName(): String = "$firstName $lastName"

// UI layer owns rendering
fun User.toListItemHtml(): String = "<li>$firstName $lastName ($email)</li>"

// Analytics layer owns its own mapping
fun User.toAnalyticsProperties(): Map<String, String> =
    mapOf("user_id" to id, "email_domain" to email.substringAfter("@"))
```

## Keeping Extensions Cohesive

```kotlin
// Group related extensions in a file named after their concern, not scattered ad hoc.
// StringExtensions.kt
fun String.isValidEmail(): Boolean = contains("@") && substringAfter("@").contains(".")
fun String.truncate(maxLength: Int): String =
    if (length <= maxLength) this else take(maxLength - 1) + "…"

// Avoid: an extension that reaches into unrelated internals or requires
// so much context that it isn't really "adding a small capability" anymore -
// that's a sign the logic belongs in a member function or a separate class.
```

## When a Member Function Is Better

```kotlin
class BankAccount(private var balance: Double) {
    // Needs access to private state and must be overridable/polymorphic -
    // extension functions can't access privates and are resolved statically.
    fun withdraw(amount: Double) {
        require(amount <= balance) { "Insufficient funds" }
        balance -= amount
    }
}
```

## See Also

- [`api-visibility-internal`](api-visibility-internal.md) - keep extension helpers `internal` unless meant for external use
- [`fn-higher-order-functions`](fn-higher-order-functions.md) - pairs well with extension functions for fluent APIs
- [`anti-god-object`](anti-god-object.md) - the failure mode this rule prevents
