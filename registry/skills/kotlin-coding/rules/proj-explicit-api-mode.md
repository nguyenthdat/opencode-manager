# proj-explicit-api-mode

> Enable `explicitApi()` for libraries to force intentional public API declarations

## Why It Matters

Without explicit API mode, a class, function, or property is `public` by default, so a library author can accidentally ship an internal helper as part of the binary-compatible public surface just by forgetting a modifier. Once that leaks into a published artifact, removing it is a breaking change. `explicitApi()` makes the compiler require an explicit visibility modifier and return type on every public declaration.

## Bad

```kotlin
// A library module with no explicit API mode
package com.example.httpclient

class RequestBuilder {
    // No modifier = public by default. Was this meant to be internal?
    var retryCount = 3

    // Return type inferred, and it's public - if the inferred type
    // changes later, that's a silent breaking change for consumers
    fun build() = HttpRequestImpl(retryCount)
}
```

## Good

```kotlin
// build.gradle.kts
kotlin {
    explicitApi() // or explicitApi(ExplicitApiMode.Warning) while migrating
}
```

```kotlin
package com.example.httpclient

public class RequestBuilder {
    // Compiler now forces you to decide: public, internal, or private
    internal var retryCount: Int = 3

    public fun build(): HttpRequest = RequestImpl(retryCount)
}

internal class RequestImpl(private val retryCount: Int) : HttpRequest
```

## Warning Mode for Migration

```kotlin
kotlin {
    // Reports missing visibility/return type as warnings, not errors,
    // so an existing codebase can migrate incrementally
    explicitApiWarning()
}
```

## See Also

- [`proj-api-vs-impl-module`](proj-api-vs-impl-module.md) - explicit API mode is most valuable on the `api` module
- [`lint-explicit-api-warning`](lint-explicit-api-warning.md) - wire this into CI so regressions are caught
- [`api-visibility-internal`](api-visibility-internal.md) - the modifier discipline this mode enforces
- [`doc-kdoc-public-api`](doc-kdoc-public-api.md) - every declaration this mode surfaces should also be documented
