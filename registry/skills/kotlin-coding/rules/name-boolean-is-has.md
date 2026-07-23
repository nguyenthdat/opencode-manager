# name-boolean-is-has

> Name boolean properties/functions `isX`/`hasX`/`canX`

## Why It Matters

A boolean named `active` or `enabled` reads ambiguously at a call site (`if (active)` could be a verb or a noun), while `isActive` unambiguously signals a yes/no predicate. This convention also keeps generated Java accessors (`isActive()`) working correctly for frameworks and interop that expect the JavaBean `isX` getter pattern for booleans.

## Bad

```kotlin
data class FeatureFlag(
    val enabled: Boolean,
    val visible: Boolean,
    val permission: Boolean,
)

fun readyToSubmit(form: Form): Boolean = form.isValid && form.enabled
```

## Good

```kotlin
data class FeatureFlag(
    val isEnabled: Boolean,
    val isVisible: Boolean,
    val hasPermission: Boolean,
)

fun canSubmit(form: Form): Boolean = form.isValid && form.isEnabled
```

## Choosing a Prefix

```kotlin
class Order {
    val isPaid: Boolean          // state check
    val hasDiscount: Boolean     // possession/existence check
    fun canCancel(): Boolean     // capability/permission check
}
```

Use `isX` for state ("is it in this state?"), `hasX` for possession or presence of something, and `canX` for a capability or permission check — pick whichever reads most naturally as a question and stay consistent within a type.

## Interop Note

```kotlin
data class User(val isAdmin: Boolean)
// Java sees: public boolean isAdmin()
```

Because Kotlin generates a Java-visible `isAdmin()` getter (not `getIsAdmin()`) for boolean properties already prefixed with `is`, following this convention also keeps generated Java bytecode idiomatic.

## See Also

- [`name-functions-camel`](name-functions-camel.md) - the base casing convention this refines
- [`interop-property-getter-setter-java`](interop-property-getter-setter-java.md) - how boolean getters surface in Java
- [`name-no-hungarian-notation`](name-no-hungarian-notation.md) - contrast with type-prefix cruft to avoid
