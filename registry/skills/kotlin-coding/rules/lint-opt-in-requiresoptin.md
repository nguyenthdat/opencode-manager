# lint-opt-in-requiresoptin

> Require explicit opt-in (`@RequiresOptIn`) for experimental APIs

## Why It Matters

Shipping an unstable API as plain `public` invites consumers to depend on it before you're ready to commit to its shape, and once they do, changing it becomes a breaking change you didn't intend to promise. `@RequiresOptIn` makes the compiler force callers to explicitly acknowledge instability, so you can iterate on the design and consumers can't accidentally take an undocumented dependency on it.

## Bad

```kotlin
package com.example.cache

// Plain public - looks exactly as stable as everything else in the
// library, but the design is still being iterated on
public class ExperimentalLruCache<K, Any>(private val maxSize: Int) {
    public fun evictionPolicy(): EvictionPolicy = TODO()
}
// Consumers depend on it in production; changing the API later
// breaks them without warning
```

## Good

```kotlin
package com.example.cache

@RequiresOptIn(
    message = "This API is experimental and may change without notice.",
    level = RequiresOptIn.Level.WARNING,
)
@Retention(AnnotationRetention.BINARY)
public annotation class ExperimentalCacheApi

@ExperimentalCacheApi
public class LruCache<K, V>(private val maxSize: Int) {
    public fun evictionPolicy(): EvictionPolicy = TODO()
}
```

```kotlin
// Consumer must explicitly opt in - a deliberate, visible decision
@OptIn(ExperimentalCacheApi::class)
fun useCache() {
    val cache = LruCache<String, Int>(maxSize = 100)
}

// Or file/module-wide via build.gradle.kts:
// kotlin { compilerOptions { optIn.add("com.example.cache.ExperimentalCacheApi") } }
```

## Propagating the Annotation

```kotlin
@ExperimentalCacheApi
public fun createDefaultCache(): LruCache<String, Any> = LruCache(maxSize = 256)
// Callers of createDefaultCache must also opt in - the annotation
// propagates through the call graph automatically
```

## See Also

- [`proj-explicit-api-mode`](proj-explicit-api-mode.md) - pairs with explicit API mode to keep the public surface intentional
- [`doc-deprecated-replacewith`](doc-deprecated-replacewith.md) - the lifecycle stage after an experimental API stabilizes or is replaced
- [`lint-suppress-with-justification`](lint-suppress-with-justification.md) - `@OptIn` should carry the same justification discipline as `@Suppress`
