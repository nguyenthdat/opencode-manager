# test-parameterized-tests

> Use parameterized/table-driven tests for input/output variants

## Why It Matters

Copy-pasting a near-identical test method for every input variant multiplies maintenance cost — a bug fix or assertion change has to be repeated N times, and it's easy for the copies to drift out of sync. Parameterized tests express the shared logic once and the varying data as a table, which is also what shows up in the test report as one row per case if a case fails.

## Bad

```kotlin
@Test
fun `isValidEmail rejects missing at-sign`() {
    assertFalse(isValidEmail("userexample.com"))
}

@Test
fun `isValidEmail rejects missing domain`() {
    assertFalse(isValidEmail("user@"))
}

@Test
fun `isValidEmail accepts a normal address`() {
    assertTrue(isValidEmail("user@example.com"))
}
```

## Good

```kotlin
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource

class EmailValidatorTest {
    @ParameterizedTest(name = "isValidEmail(\"{0}\") == {1}")
    @CsvSource(
        "userexample.com, false",
        "user@, false",
        "'', false",
        "user@example.com, true",
        "first.last+tag@example.co.uk, true",
    )
    fun `validates emails against a table of cases`(input: String, expected: Boolean) {
        assertEquals(expected, isValidEmail(input))
    }
}
```

## Kotest's Data-Driven Alternative

```kotlin
import io.kotest.core.spec.style.FunSpec
import io.kotest.datatest.withData

class EmailValidatorTest : FunSpec({
    withData(
        "userexample.com" to false,
        "user@" to false,
        "user@example.com" to true,
    ) { (input, expected) ->
        isValidEmail(input) shouldBe expected
    }
})
```

## Complex Objects with `@MethodSource`

```kotlin
@ParameterizedTest
@MethodSource("discountCases")
fun `applies the correct discount`(order: Order, expectedTotal: Double) {
    assertEquals(expectedTotal, DiscountCalculator.calculate(order))
}

companion object {
    @JvmStatic
    fun discountCases() = listOf(
        Arguments.of(Order(subtotal = 100.0, code = "TEN_OFF"), 90.0),
        Arguments.of(Order(subtotal = 50.0, code = null), 50.0),
    )
}
```

Reach for `@MethodSource` (or Kotest's `withData` on non-primitive rows) once cases need real domain objects rather than the primitive strings `@CsvSource` supports.

## See Also

- [`test-kotest-specs`](test-kotest-specs.md) - `withData` as Kotest's table-driven mechanism
- [`test-fixture-builders`](test-fixture-builders.md) - building the domain objects used as parameterized rows
- [`test-descriptive-backtick-names`](test-descriptive-backtick-names.md) - naming the generated per-row test cases clearly
