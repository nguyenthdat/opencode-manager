# name-constants-screaming-snake

> Use `SCREAMING_SNAKE_CASE` for top-level/companion `const val`

## Why It Matters

SCREAMING_SNAKE_CASE signals "this is a compile-time constant baked into the bytecode," distinguishing it at a glance from a regular `val` that might be computed lazily or hold mutable state. Getting this wrong on a `const val` that's actually mutable-looking, or applying it to a non-const property, misleads readers about what can safely be inlined or referenced from Java as a `static final` field.

## Bad

```kotlin
class HttpClient {
    companion object {
        const val defaultTimeoutMs = 30_000L
        const val MaxRetries = 3
    }
}

const val apiBaseUrl = "https://api.example.com"
```

## Good

```kotlin
class HttpClient {
    companion object {
        const val DEFAULT_TIMEOUT_MS = 30_000L
        const val MAX_RETRIES = 3
    }
}

const val API_BASE_URL = "https://api.example.com"
```

## When Not to Scream

```kotlin
class Config {
    // Not a compile-time constant (depends on runtime), so it's camelCase
    val startedAt: Instant = Instant.now()

    companion object {
        // Still a real compile-time constant -> SCREAMING_SNAKE_CASE
        const val SCHEMA_VERSION = 4
    }
}
```

`const val` only applies to top-level or companion-object properties of primitive/`String` type initialized with a compile-time constant expression — anything computed at runtime keeps camelCase regardless of how "constant" it feels.

## Ktlint/Detekt Rule

`detekt`'s `naming.TopLevelPropertyNaming` has a separate `constantPattern` (default `[A-Z][A-Za-z0-9]*|[A-Z_]+`) for `const val`:

```yaml
naming:
  TopLevelPropertyNaming:
    constantPattern: '[A-Z][A-Z0-9_]*'
```

## See Also

- [`name-functions-camel`](name-functions-camel.md) - default casing for non-constant properties
- [`interop-const-val-compile-time`](interop-const-val-compile-time.md) - how `const val` maps to Java `static final`
- [`perf-jvmstatic-jvmfield`](perf-jvmstatic-jvmfield.md) - related companion-object performance annotations
