# type-platform-type-annotate

> Annotate Java interop boundaries so platform types don't leak

## Why It Matters

When Kotlin calls Java code without nullability annotations, it sees a "platform type" (`String!`) that suppresses null-safety checks entirely — the compiler trusts you to know whether it's actually nullable. If that platform type flows unannotated into your Kotlin API surface, every caller loses null-safety too, and an NPE can surface far from the actual Java call that produced the null.

## Bad

```kotlin
// LegacyUserService.java has no @Nullable/@NonNull annotations
class UserRepository(private val legacyService: LegacyUserService) {

    // Platform type `String!` leaks straight through - callers get no null-safety
    fun getDisplayName(id: String) = legacyService.findName(id)
}

fun greet(repository: UserRepository, id: String) {
    val name = repository.getDisplayName(id)
    println(name.uppercase())  // Crashes at runtime if findName() returned null - compiler didn't warn
}
```

## Good

```kotlin
class UserRepository(private val legacyService: LegacyUserService) {

    // Immediately decide and declare the real nullability at the boundary
    fun getDisplayName(id: String): String? = legacyService.findName(id)
}

fun greet(repository: UserRepository, id: String) {
    val name = repository.getDisplayName(id) ?: "Unknown"
    println(name.uppercase())  // Compiler now enforces the null check
}
```

## Annotating The Java Side

When you control the Java code, add `@Nullable`/`@NonNull` (JSR-305, JetBrains, or Android annotations) so Kotlin infers real nullable/non-null types instead of platform types automatically.

```java
// LegacyUserService.java
public class LegacyUserService {
    @Nullable
    public String findName(String id) { /* ... */ }
}
```

```kotlin
// Now Kotlin sees `String?` directly - no platform type, no manual annotation needed
fun getDisplayName(id: String): String? = legacyService.findName(id)
```

## See Also

- [`interop-nullability-annotations-java`](interop-nullability-annotations-java.md) - annotating Java sources for accurate platform types
- [`interop-platform-type-handling`](interop-platform-type-handling.md) - broader strategy for consuming unannotated Java APIs
- [`type-safe-call-operator`](type-safe-call-operator.md) - how to safely consume the now-explicit nullable type
