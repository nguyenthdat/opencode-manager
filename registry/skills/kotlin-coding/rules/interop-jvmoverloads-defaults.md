# interop-jvmoverloads-defaults

> Use `@JvmOverloads` so Java callers get overloads for default parameters

## Why It Matters

Kotlin default parameter values are erased for Java callers — without `@JvmOverloads`, Java code must pass every parameter explicitly, even ones with sensible Kotlin-side defaults, making the API awkward and verbose to use from Java.

## Bad

```kotlin
class HttpClient {
    fun request(url: String, timeoutMs: Int = 5000, retries: Int = 3): Response {
        return Response()
    }
}
```

```java
// Java caller MUST supply all three params - defaults are invisible
Response r = client.request("https://example.com", 5000, 3);
```

## Good

```kotlin
class HttpClient {
    @JvmOverloads
    fun request(url: String, timeoutMs: Int = 5000, retries: Int = 3): Response {
        return Response()
    }
}
```

```java
// Java now sees overloads: request(url), request(url, timeout), request(url, timeout, retries)
Response r = client.request("https://example.com");
```

## Constructor Defaults Too

```kotlin
class RetryPolicy @JvmOverloads constructor(
    val maxAttempts: Int = 3,
    val backoffMs: Long = 200L,
)
```

```java
RetryPolicy policy = new RetryPolicy(); // uses both defaults
```

## Limits

`@JvmOverloads` generates one overload per default parameter, working backwards from the last one — it can't skip a middle parameter while keeping a later one. Order parameters so the most commonly overridden ones come last.

## See Also

- [`interop-jvmname-clash`](interop-jvmname-clash.md) - another annotation for smoothing Java-facing signatures
- [`interop-jvmstatic-companion`](interop-jvmstatic-companion.md) - complementary Java-ergonomics annotation
- [`api-default-params-over-overloads`](api-default-params-over-overloads.md) - the Kotlin-side rationale for default parameters
