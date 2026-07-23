# proj-internal-module-boundary

> Enforce module boundaries with `internal` visibility, not convention alone

## Why It Matters

A module boundary that's only documented in a README or a naming convention ("please don't import from `.impl` packages") gets violated the first time someone is in a hurry, because the compiler doesn't stop them. Kotlin's `internal` visibility modifier makes a class invisible outside its own module (compilation unit), turning a social contract into a compiler-enforced one.

## Bad

```kotlin
// core/payments/src/main/kotlin/.../PaymentGateway.kt
package com.example.payments

// Public "by convention only" - nothing stops other modules from
// constructing this directly and bypassing PaymentGateway
class StripePaymentClient(private val apiKey: String) {
    fun charge(amountCents: Long): ChargeResult = /* ... */ error("unimplemented")
}

// feature/checkout module reaches straight past the intended API
val client = StripePaymentClient(apiKey = secretKey) // allowed, shouldn't be
```

## Good

```kotlin
// core/payments/src/main/kotlin/.../PaymentGateway.kt
package com.example.payments

interface PaymentGateway {
    suspend fun charge(amount: Money): ChargeResult
}

// Compiler-enforced: invisible to other modules, so :feature:checkout
// literally cannot reference it, let alone construct it
internal class StripePaymentClient(
    private val apiKey: String,
) : PaymentGateway {
    override suspend fun charge(amount: Money): ChargeResult = /* ... */ error("unimplemented")
}

internal class PaymentModule {
    fun paymentGateway(apiKey: String): PaymentGateway = StripePaymentClient(apiKey)
}
```

## Constructor and Property Granularity

```kotlin
class Order internal constructor(
    val id: OrderId,
    val items: List<LineItem>,
) {
    // Public read, but only this module can construct an Order,
    // preventing invalid instances from being built elsewhere
}
```

## See Also

- [`proj-api-vs-impl-module`](proj-api-vs-impl-module.md) - decide what crosses the boundary at all
- [`api-visibility-internal`](api-visibility-internal.md) - the general visibility rule this specializes for module boundaries
- [`proj-explicit-api-mode`](proj-explicit-api-mode.md) - catches accidental public leaks at the same enforcement level
