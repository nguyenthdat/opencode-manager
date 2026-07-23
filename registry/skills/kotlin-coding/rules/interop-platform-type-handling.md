# interop-platform-type-handling

> Explicitly annotate nullability at Java boundaries instead of trusting platform types

## Why It Matters

Types coming from Java without `@Nullable`/`@NonNull` annotations appear in Kotlin as "platform types" (`String!`) that suppress the compiler's null checks entirely. Trusting them without explicit handling defers null-pointer failures to runtime instead of catching them at compile time.

## Bad

```kotlin
// legacyApi.getUserName() returns a Java String with no nullability annotation
fun greet(legacyApi: LegacyUserApi): String {
    val name = legacyApi.getUserName() // platform type String! - compiler assumes non-null
    return "Hello, ${name.uppercase()}" // NPE at runtime if Java actually returns null
}
```

## Good

```kotlin
fun greet(legacyApi: LegacyUserApi): String {
    val name: String? = legacyApi.getUserName() // explicitly typed nullable, forces handling
    return "Hello, ${name?.uppercase() ?: "Guest"}"
}

// Or fail fast with a clear message instead of a silent NPE
fun greetStrict(legacyApi: LegacyUserApi): String {
    val name = requireNotNull(legacyApi.getUserName()) { "userName must not be null" }
    return "Hello, ${name.uppercase()}"
}
```

## Wrapping at the Boundary

Isolate platform-type risk to a thin adapter layer so the rest of the codebase only ever sees Kotlin-safe types:

```kotlin
class UserApiAdapter(private val legacy: LegacyUserApi) {
    fun userName(): String? = legacy.getUserName() // one place declares the real nullability
}
```

## See Also

- [`interop-nullability-annotations-java`](interop-nullability-annotations-java.md) - fixing this at the Java source instead
- [`type-platform-type-annotate`](type-platform-type-annotate.md) - Kotlin-side conventions for platform types
- [`type-avoid-not-null-assert`](type-avoid-not-null-assert.md) - avoid papering over platform types with `!!`
- [`err-require-precondition`](err-require-precondition.md) - `requireNotNull` as a fail-fast alternative
