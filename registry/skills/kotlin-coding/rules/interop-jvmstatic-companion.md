# interop-jvmstatic-companion

> Use `@JvmStatic` in a companion object for natural static calls from Java

## Why It Matters

Without `@JvmStatic`, companion object members are only accessible from Java via `Companion.member()`, which is unidiomatic and surprises Java-side consumers expecting a plain static method. `@JvmStatic` generates a true static method on the enclosing class in addition to the instance method on `Companion`.

## Bad

```kotlin
class UserFactory {
    companion object {
        fun createGuest(): UserFactory = UserFactory()
    }
}
```

```java
// Java is forced to go through Companion
UserFactory guest = UserFactory.Companion.createGuest();
```

## Good

```kotlin
class UserFactory {
    companion object {
        @JvmStatic
        fun createGuest(): UserFactory = UserFactory()
    }
}
```

```java
// Reads like a normal static factory method
UserFactory guest = UserFactory.createGuest();
```

## Fields Too

```kotlin
class Constants {
    companion object {
        @JvmStatic
        val DEFAULT_REGION = "us-east-1" // Java: Constants.DEFAULT_REGION
    }
}
```

## See Also

- [`perf-jvmstatic-jvmfield`](perf-jvmstatic-jvmfield.md) - the performance angle of these same annotations
- [`interop-jvmoverloads-defaults`](interop-jvmoverloads-defaults.md) - complementary Java-ergonomics annotation
- [`interop-const-val-compile-time`](interop-const-val-compile-time.md) - constants that need no annotation at all
