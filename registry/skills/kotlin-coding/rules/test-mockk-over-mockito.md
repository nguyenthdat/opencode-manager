# test-mockk-over-mockito

> Use MockK for idiomatic Kotlin mocking (including `object`/`final` classes)

## Why It Matters

Mockito was built for Java and struggles with Kotlin-specific constructs: it can't mock `final` classes (the Kotlin default) without extra agent configuration, has no clean way to mock `object` singletons or top-level/extension functions, and its APIs don't leverage Kotlin's lambda syntax. MockK is written in and for Kotlin, so mocking `object`s, extension functions, and coroutine `suspend` functions all work directly without workarounds.

## Bad

```kotlin
// Mockito: needs mockito-inline just to mock a final Kotlin class,
// and can't mock `object PaymentGateway` or top-level functions at all
@Test
fun `charges the card`() {
    val gateway = mock(PaymentGateway::class.java) // fails: PaymentGateway is final
    `when`(gateway.charge(100.0)).thenReturn(true)
    // ...
}
```

## Good

```kotlin
import io.mockk.every
import io.mockk.mockk
import io.mockk.coEvery
import io.mockk.coVerify

class BillingServiceTest {
    @Test
    fun `charges the card and records the transaction`() = runTest {
        val gateway = mockk<PaymentGateway>() // works on final classes with no extra setup
        coEvery { gateway.charge(100.0) } returns ChargeResult.Success("txn_1")

        val service = BillingService(gateway)
        val result = service.processPayment(100.0)

        assertTrue(result.isSuccess)
        coVerify(exactly = 1) { gateway.charge(100.0) }
    }
}
```

## Mocking Objects and Extension Functions

```kotlin
import io.mockk.mockkObject
import io.mockk.unmockkObject

@Test
fun `uses feature flag from singleton`() {
    mockkObject(FeatureFlags)
    every { FeatureFlags.isNewCheckoutEnabled() } returns true

    assertTrue(Checkout.shouldUseNewFlow())

    unmockkObject(FeatureFlags)
}
```

## Relaxed Mocks for Verbose Interfaces

```kotlin
val analytics = mockk<AnalyticsTracker>(relaxed = true) // auto-stubs every method with a default
service.doSomething(analytics)
verify { analytics.track("something_happened") }
```

Use `relaxed = true` sparingly — for wide interfaces where you only care about verifying one or two calls — rather than as a default, since it can hide missing stubs for methods whose return value actually matters.

## See Also

- [`test-fake-over-mock`](test-fake-over-mock.md) - when a hand-written fake beats any mock
- [`test-runtest-coroutines`](test-runtest-coroutines.md) - `coEvery`/`coVerify` require a coroutine test scope
- [`async-suspend-fun-design`](async-suspend-fun-design.md) - designing suspend APIs that MockK can stub cleanly
