# interop-const-val-compile-time

> Use `const val` for compile-time constants exposed to Java as `static final`

## Why It Matters

A regular top-level or companion `val` compiles to a getter method backed by a field, requiring a method call from Java and making it unusable in Java `switch`/annotation contexts. `const val` — restricted to primitives and `String`, known at compile time — compiles to a true `public static final` field, inlined at every Kotlin call site and directly usable from Java.

## Bad

```kotlin
class ApiConfig {
    companion object {
        val MAX_RETRIES = 3 // compiles to a getter, not a Java-visible static final
    }
}
```

```java
int retries = ApiConfig.Companion.getMAX_RETRIES(); // clunky, and can't be used in a Java `case` label
```

## Good

```kotlin
class ApiConfig {
    companion object {
        const val MAX_RETRIES = 3 // true static final int, usable in Java and in annotations
    }
}
```

```java
int retries = ApiConfig.MAX_RETRIES; // direct field access
```

## Restrictions

`const val` only works for `String` and primitive types, must be a top-level declaration or inside an `object`/companion object, and must be initialized with a compile-time constant expression (no function calls).

## See Also

- [`perf-jvmstatic-jvmfield`](perf-jvmstatic-jvmfield.md) - the related field/method interop-overhead annotations
- [`interop-jvmstatic-companion`](interop-jvmstatic-companion.md) - exposing companion members naturally to Java
- [`name-constants-screaming-snake`](name-constants-screaming-snake.md) - naming convention for constants like `MAX_RETRIES`
