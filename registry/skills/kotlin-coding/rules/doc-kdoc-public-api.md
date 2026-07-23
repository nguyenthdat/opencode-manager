# doc-kdoc-public-api

> Document all public API with KDoc (`/** */`)

## Why It Matters

Public classes and functions are a contract with every caller who can't see your implementation — without KDoc, consumers must read source code (or worse, guess from the name) to understand behavior, edge cases, and units. Undocumented public API also means Dokka-generated reference docs have gaps exactly where external users need them most.

## Bad

```kotlin
class RateLimiter(private val maxRequests: Int, private val window: Duration) {
    fun tryAcquire(key: String): Boolean {
        // ...
    }

    fun reset(key: String) {
        // ...
    }
}
```

## Good

```kotlin
/**
 * A sliding-window rate limiter keyed by an arbitrary string (e.g. user id, IP address).
 *
 * Each key is tracked independently; exceeding [maxRequests] within [window] causes
 * subsequent calls to [tryAcquire] to return `false` until the window slides forward.
 */
class RateLimiter(private val maxRequests: Int, private val window: Duration) {

    /**
     * Attempts to consume one request slot for [key].
     *
     * @return `true` if the request is allowed, `false` if [key] has exceeded [maxRequests]
     *   within the current [window].
     */
    fun tryAcquire(key: String): Boolean {
        // ...
    }

    /** Clears all rate-limit history for [key], as if it had never made a request. */
    fun reset(key: String) {
        // ...
    }
}
```

## What Doesn't Need KDoc

```kotlin
internal class RequestQueue // internal API - KDoc optional, comments still fine for complex logic

private fun normalizeKey(key: String): String = key.trim().lowercase() // private, self-evident
```

Internal and private declarations don't need the same documentation rigor as public API — reserve KDoc effort for what actually crosses a module boundary, and rely on clear naming plus targeted inline comments for the rest.

## Ktlint/Detekt Rule

`detekt`'s `comments.UndocumentedPublicClass` and `comments.UndocumentedPublicFunction` flag missing KDoc on public declarations:

```yaml
comments:
  UndocumentedPublicClass:
    active: true
  UndocumentedPublicFunction:
    active: true
```

## See Also

- [`doc-kdoc-param-return`](doc-kdoc-param-return.md) - documenting parameters and return values specifically
- [`doc-kdoc-throws-tag`](doc-kdoc-throws-tag.md) - documenting exceptions a public function can throw
- [`doc-dokka-generation`](doc-dokka-generation.md) - generating browsable docs from this KDoc
- [`api-visibility-internal`](api-visibility-internal.md) - deciding what should be public in the first place
