# proj-package-by-feature

> Organize packages by feature/domain, not by technical layer

## Why It Matters

Packaging by technical layer (`controllers`, `services`, `repositories`) scatters everything related to one feature across the whole tree, so a single change touches five directories and package-private visibility becomes useless because nothing that belongs together is actually together. Packaging by feature keeps related classes co-located, lets you use narrower visibility, and makes it obvious what to delete when a feature is removed.

## Bad

```kotlin
// com/example/app/controllers/CheckoutController.kt
// com/example/app/services/CheckoutService.kt
// com/example/app/repositories/CheckoutRepository.kt
// com/example/app/controllers/ProfileController.kt
// com/example/app/services/ProfileService.kt
// com/example/app/repositories/ProfileRepository.kt

// Deleting "checkout" means hunting through 3+ packages
// and every class must be public to be visible across packages
```

## Good

```kotlin
// com/example/app/checkout/CheckoutController.kt
// com/example/app/checkout/CheckoutService.kt
// com/example/app/checkout/CheckoutRepository.kt
// com/example/app/checkout/CheckoutRequest.kt   // internal, only used here

// com/example/app/profile/ProfileController.kt
// com/example/app/profile/ProfileService.kt
// com/example/app/profile/ProfileRepository.kt

package com.example.app.checkout

internal class CheckoutRepository(private val db: Database) {
    fun findOrder(id: OrderId): Order? = db.query(id)
}

class CheckoutService internal constructor(
    private val repository: CheckoutRepository,
) {
    fun checkout(cart: Cart): Order = /* ... */ error("unimplemented")
}
```

## Shared Code Still Gets Its Own Package

```kotlin
// com/example/app/common/Money.kt
// com/example/app/common/Clock.kt
// Only truly cross-feature types live in `common` - resist dumping
// everything there, or it becomes the same problem under a new name.
```

## See Also

- [`proj-gradle-multi-module`](proj-gradle-multi-module.md) - graduate a feature package into its own module when it grows
- [`api-visibility-internal`](api-visibility-internal.md) - use `internal` now that related classes share a package
- [`anti-god-object`](anti-god-object.md) - a `common` or `utils` package is the packaging-level version of this
