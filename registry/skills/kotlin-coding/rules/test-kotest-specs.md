# test-kotest-specs

> Use Kotest spec styles (`FunSpec`, `BehaviorSpec`) for expressive test structure

## Why It Matters

Kotest's spec styles replace boilerplate `@Test fun` declarations with a DSL that mirrors how you'd describe behavior in prose, and its matcher library (`shouldBe`, `shouldContain`) produces far more readable failure diffs than raw JUnit `assertEquals`. Picking a spec style also standardizes how a whole codebase structures "given/when/then" logic instead of every file inventing its own convention.

## Bad

```kotlin
class OrderValidatorTest {
    @Test
    fun test1() {
        val result = OrderValidator.validate(Order(items = emptyList()))
        assertTrue(result is ValidationResult.Invalid)
    }
}
```

## Good

```kotlin
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.types.shouldBeInstanceOf

class OrderValidatorTest : FunSpec({
    test("an order with no items is invalid") {
        val result = OrderValidator.validate(Order(items = emptyList()))
        result.shouldBeInstanceOf<ValidationResult.Invalid>()
    }

    test("an order with at least one item is valid") {
        val result = OrderValidator.validate(Order(items = listOf(Item("apple", 1.0))))
        result shouldBe ValidationResult.Valid
    }
})
```

## BehaviorSpec for Given/When/Then

```kotlin
import io.kotest.core.spec.style.BehaviorSpec

class DiscountCalculatorTest : BehaviorSpec({
    given("a cart with a 10% discount code applied") {
        val cart = Cart(subtotal = 100.0, discountCode = "TEN_OFF")

        `when`("calculating the total") {
            val total = DiscountCalculator.calculate(cart)

            then("it subtracts 10% from the subtotal") {
                total shouldBe 90.0
            }
        }
    }
})
```

## Gradle Setup

```kotlin
dependencies {
    testImplementation("io.kotest:kotest-runner-junit5:5.9.1")
    testImplementation("io.kotest:kotest-assertions-core:5.9.1")
}
```

Kotest runs on top of the JUnit 5 platform, so it coexists with existing JUnit 5 tests in the same module without any extra runner configuration.

## See Also

- [`test-assertk-fluent-assertions`](test-assertk-fluent-assertions.md) - Kotest's matcher library as one fluent-assertion option
- [`test-descriptive-backtick-names`](test-descriptive-backtick-names.md) - the naming philosophy Kotest's string-based tests embody
- [`test-parameterized-tests`](test-parameterized-tests.md) - Kotest's `withData` for table-driven tests
