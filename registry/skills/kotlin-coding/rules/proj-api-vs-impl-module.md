# proj-api-vs-impl-module

> Separate a module's public `api` surface from its `implementation` details

## Why It Matters

When every dependency is declared `api` (or all code lives in one module with no visibility distinction), consumers can accidentally depend on internal classes, and a change to an implementation detail forces every downstream module to recompile even though nothing they actually use changed. Splitting `api` from `implementation` dependencies — and often into separate `:foo-api` / `:foo` modules — keeps the recompilation blast radius small and the public contract explicit.

## Bad

```kotlin
// core/payments/build.gradle.kts
dependencies {
    // Leaks Retrofit/OkHttp types into every module that depends on :payments,
    // even ones that only call a couple of public functions
    api("com.squareup.retrofit2:retrofit:2.11.0")
    api("com.squareup.okhttp3:okhttp:4.12.0")
}
```

## Good

```kotlin
// core/payments/build.gradle.kts
dependencies {
    // Internal wiring - not exposed to consumers, changes here don't
    // force downstream recompilation
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // Only expose types that are genuinely part of the public contract
    api(project(":core:money"))
}
```

```kotlin
// Public surface, kept intentionally small
package com.example.payments

interface PaymentGateway {
    suspend fun charge(amount: Money, source: PaymentSource): ChargeResult
}

// Retrofit service interface stays internal to the module
internal interface PaymentApi {
    @POST("charges") suspend fun charge(@Body body: ChargeRequest): ChargeResponse
}
```

## When a Full `api`/`impl` Module Split Pays Off

For widely-depended-on modules (used by 10+ other modules), split into `:payments-api` (interfaces, data classes) and `:payments` (implementation). Feature modules depend on `:payments-api`; only the composition root depends on `:payments`, so swapping implementations never touches feature code.

## See Also

- [`proj-internal-module-boundary`](proj-internal-module-boundary.md) - enforce that implementation types can't leak even by accident
- [`proj-explicit-api-mode`](proj-explicit-api-mode.md) - force every public declaration in the api module to be intentional
- [`proj-gradle-multi-module`](proj-gradle-multi-module.md) - the module split this rule refines
