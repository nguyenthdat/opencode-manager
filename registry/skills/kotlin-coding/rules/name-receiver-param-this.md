# name-receiver-param-this

> Name lambda receivers implicitly via `this`, not a redundant explicit parameter

## Why It Matters

Kotlin's function-type-with-receiver (`T.() -> Unit`) exists so DSL-style lambdas can call receiver members without qualification; explicitly naming a parameter and then dotting into it everywhere defeats the ergonomic point of the receiver and clutters call sites that are supposed to read like a mini-language (`apply`, `buildString`, custom DSL builders).

## Bad

```kotlin
fun buildRequest(block: (RequestBuilder) -> Unit): Request {
    val builder = RequestBuilder()
    block(builder)
    return builder.build()
}

buildRequest { builder ->
    builder.method = "GET"
    builder.url = "https://api.example.com"
    builder.header("Accept", "application/json")
}
```

## Good

```kotlin
fun buildRequest(block: RequestBuilder.() -> Unit): Request {
    val builder = RequestBuilder()
    builder.block()
    return builder.build()
}

buildRequest {
    method = "GET"
    url = "https://api.example.com"
    header("Accept", "application/json")
}
```

## Disambiguating Nested Receivers

```kotlin
class Outer {
    fun render(block: Outer.() -> Unit) = block()
}

class Inner {
    fun style(block: Inner.() -> Unit) = block()
}

outer.render {
    inner.style {
        // 'this' here is Inner; to reach Outer's members, label it
        this@render.doSomethingOnOuter()
    }
}
```

When two receivers are in scope, use a labeled `this@FunctionName` to disambiguate rather than falling back to explicit named parameters everywhere — this preserves the DSL feel while still resolving ambiguity only where it actually exists.

## See Also

- [`api-dsl-lambda-receiver`](api-dsl-lambda-receiver.md) - designing DSL functions with receiver lambdas
- [`fn-scope-function-apply`](fn-scope-function-apply.md) - `apply`, the standard-library receiver-lambda function
- [`fn-scope-function-with`](fn-scope-function-with.md) - `with`, another receiver-based scope function
