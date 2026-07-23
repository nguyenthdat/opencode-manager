# interop-nullability-annotations-java

> Annotate Java APIs with `@Nullable`/`@NonNull` for accurate Kotlin inference

## Why It Matters

When Java code lacks JSR-305 (`@Nullable`/`@Nonnull`) or JetBrains annotations, Kotlin can't tell whether a returned reference can be null and falls back to an unchecked "platform type," pushing the null-safety burden entirely onto callers. Annotating the Java source lets Kotlin treat the type as genuinely nullable or non-null.

## Bad

```java
// UserRepository.java - no nullability annotations
public class UserRepository {
    public User findById(String id) {
        return database.get(id); // may return null, but Kotlin can't tell
    }
}
```

```kotlin
val user = userRepository.findById("42") // User! platform type, compiler can't help
println(user.name) // possible NPE, no warning
```

## Good

```java
// UserRepository.java - explicit nullability
public class UserRepository {
    @Nullable
    public User findById(String id) {
        return database.get(id);
    }
}
```

```kotlin
val user: User? = userRepository.findById("42") // Kotlin now enforces a null check
println(user?.name ?: "unknown")
```

## Which Annotations Kotlin Understands

Kotlin recognizes JetBrains (`org.jetbrains.annotations`), JSR-305 (`javax.annotation`), Android (`androidx.annotation.Nullable`/`NonNull`), and Lombok/Eclipse annotations. For your own Java code, prefer `androidx.annotation` on Android projects or JSR-305 for plain JVM libraries.

## See Also

- [`interop-platform-type-handling`](interop-platform-type-handling.md) - handling the Kotlin side when annotations are missing
- [`type-platform-type-annotate`](type-platform-type-annotate.md) - Kotlin conventions for platform types
- [`type-avoid-not-null-assert`](type-avoid-not-null-assert.md) - don't paper over missing annotations with `!!`
