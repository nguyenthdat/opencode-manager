# interop-property-getter-setter-java

> Know how Kotlin properties compile to Java getter/setter pairs

## Why It Matters

Kotlin `val`/`var` properties are not fields from Java's perspective by default — they compile to `getX()`/`setX()` methods, with `is`-prefixed getters for `Boolean`. Java code must call accessor methods, and naming/boolean conventions matter for a clean Java-facing API.

## Bad

```kotlin
class Account {
    var balance: Double = 0.0
    var isActive: Boolean = true
}
```

```java
// works, but easy to get wrong if you assume raw field access
Account account = new Account();
account.setBalance(100.0);
boolean active = account.isActive(); // correct - Kotlin generates isActive(), not getIsActive()
```

## Good

```kotlin
class Account {
    var balance: Double = 0.0
    var isActive: Boolean = true

    // Use @JvmField only when you deliberately want a raw public field, not accessors
    companion object {
        @JvmField
        val CURRENCY_CODE = "USD" // Java: Account.CURRENCY_CODE, not Account.getCURRENCY_CODE()
    }
}
```

## Custom Accessor Names

```kotlin
class Person(name: String) {
    var name: String = name
        @JvmName("getFullName") get
        @JvmName("setFullName") set
}
```

## See Also

- [`interop-jvmname-clash`](interop-jvmname-clash.md) - renaming accessors to avoid signature clashes
- [`name-boolean-is-has`](name-boolean-is-has.md) - the naming convention behind `isActive`-style booleans
- [`interop-jvmstatic-companion`](interop-jvmstatic-companion.md) - exposing companion members naturally to Java
