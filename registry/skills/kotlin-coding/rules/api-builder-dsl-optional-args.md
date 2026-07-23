# api-builder-dsl-optional-args

> Prefer a builder DSL over telescoping constructors for many optional parameters

## Why It Matters

A constructor with a dozen optional parameters becomes unreadable at call sites even with named arguments - callers must scan a long flat parameter list to find what's relevant. A builder DSL groups configuration logically, supports incremental/computed setup (loops, conditionals) that a single expression can't, and reads like structured configuration rather than a function call.

## Bad

```kotlin
class HttpRequest(
    val url: String,
    val method: String = "GET",
    val headers: Map<String, String> = emptyMap(),
    val queryParams: Map<String, String> = emptyMap(),
    val body: String? = null,
    val timeoutMs: Long = 30_000,
    val followRedirects: Boolean = true,
    val retryCount: Int = 0,
)

val request = HttpRequest(
    url = "https://api.example.com/users",
    method = "POST",
    headers = mapOf("Authorization" to "Bearer x", "Content-Type" to "application/json"),
    queryParams = mapOf("page" to "1"),
    body = """{"name":"Jane"}""",
    timeoutMs = 10_000,
    retryCount = 3,
)
```

## Good

```kotlin
class HttpRequestBuilder(private val url: String) {
    var method: String = "GET"
    var body: String? = null
    var timeoutMs: Long = 30_000
    var followRedirects: Boolean = true
    var retryCount: Int = 0
    private val headers = mutableMapOf<String, String>()
    private val queryParams = mutableMapOf<String, String>()

    fun header(name: String, value: String) { headers[name] = value }
    fun query(name: String, value: String) { queryParams[name] = value }

    fun build(): HttpRequest = HttpRequest(
        url, method, headers.toMap(), queryParams.toMap(), body, timeoutMs, followRedirects, retryCount,
    )
}

fun httpRequest(url: String, configure: HttpRequestBuilder.() -> Unit): HttpRequest =
    HttpRequestBuilder(url).apply(configure).build()

val request = httpRequest("https://api.example.com/users") {
    method = "POST"
    header("Authorization", "Bearer x")
    header("Content-Type", "application/json")
    query("page", "1")
    body = """{"name":"Jane"}"""
    timeoutMs = 10_000
    retryCount = 3
}
```

## When Default Params Are Enough

```kotlin
// Fewer than ~5 optional parameters with no conditional/loop-based setup:
// default parameters alone are simpler and don't need a builder at all.
fun log(message: String, level: String = "INFO", tag: String = "app") { /* ... */ }
log("started", level = "DEBUG")
```

## See Also

- [`api-dsl-lambda-receiver`](api-dsl-lambda-receiver.md) - the lambda-with-receiver mechanism builders rely on
- [`api-default-params-over-overloads`](api-default-params-over-overloads.md) - simpler alternative for fewer optional parameters
- [`fn-scope-function-apply`](fn-scope-function-apply.md) - `apply` is how builder DSL entry points are typically implemented
