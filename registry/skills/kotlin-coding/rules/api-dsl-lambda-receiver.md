# api-dsl-lambda-receiver

> Build type-safe DSLs with lambda-with-receiver (`T.() -> Unit`)

## Why It Matters

A plain lambda parameter (`(Builder) -> Unit`) forces callers to name and reference the builder explicitly at every call, which is noisy and error-prone when nesting DSLs. A lambda-with-receiver (`Builder.() -> Unit`) makes the builder's members available as if inside its own scope, enabling the fluent, nested syntax Kotlin DSLs (Gradle Kotlin DSL, `buildList`, Compose, kotlinx.html) are known for.

## Bad

```kotlin
class RequestBuilder {
    var url: String = ""
    val headers = mutableMapOf<String, String>()
}

fun request(configure: (RequestBuilder) -> Unit): Request {
    val builder = RequestBuilder()
    configure(builder)
    return Request(builder.url, builder.headers)
}

val req = request { b ->
    b.url = "https://api.example.com"
    b.headers["Authorization"] = "Bearer token"  // must qualify every access with b.
}
```

## Good

```kotlin
class RequestBuilder {
    var url: String = ""
    private val headers = mutableMapOf<String, String>()

    fun header(name: String, value: String) {
        headers[name] = value
    }

    fun build(): Request = Request(url, headers.toMap())
}

fun request(configure: RequestBuilder.() -> Unit): Request =
    RequestBuilder().apply(configure).build()

val req = request {
    url = "https://api.example.com"       // `this` is the RequestBuilder
    header("Authorization", "Bearer token") // reads like DSL syntax
}
```

## Nesting and `@DslMarker`

```kotlin
@DslMarker
annotation class HttpDsl

@HttpDsl
class RouteBuilder {
    private val routes = mutableListOf<String>()
    fun get(path: String) { routes.add("GET $path") }
}

@HttpDsl
class ServerBuilder {
    fun routes(configure: RouteBuilder.() -> Unit) = RouteBuilder().apply(configure)
}

fun server(configure: ServerBuilder.() -> Unit) = ServerBuilder().apply(configure)

server {
    routes {
        get("/health")
        // Without @DslMarker, `this@server` members would also be implicitly
        // callable here, letting nested scopes accidentally call the wrong builder.
    }
}
```

## See Also

- [`api-builder-dsl-optional-args`](api-builder-dsl-optional-args.md) - builder DSLs for many optional parameters
- [`fn-scope-function-apply`](fn-scope-function-apply.md) - `apply` powers most DSL builder entry points
- [`api-typealias-clarity`](api-typealias-clarity.md) - naming complex lambda-with-receiver types
