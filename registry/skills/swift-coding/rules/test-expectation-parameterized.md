# test-expectation-parameterized

> Use `@Test(arguments:)` for parameterized tests

## Why It Matters

Copy-pasting near-identical test functions for each input value multiplies maintenance cost and hides the fact that they're testing the same behavior. Swift Testing's `@Test(arguments:)` runs one test function once per input, reports each case's pass/fail independently in the test navigator, and keeps the assertion logic written exactly once.

## Bad

```swift
import Testing

struct EmailValidatorTests {
    @Test
    func validatesSimpleEmail() {
        #expect(EmailValidator.isValid("a@b.com"))
    }

    @Test
    func validatesEmailWithSubdomain() {
        #expect(EmailValidator.isValid("a@mail.b.com"))
    }

    @Test
    func rejectsMissingAtSign() {
        #expect(!EmailValidator.isValid("a-b.com"))
    }

    @Test
    func rejectsEmptyString() {
        #expect(!EmailValidator.isValid(""))
    }
}
```

## Good

```swift
import Testing

struct EmailValidatorTests {
    @Test(arguments: [
        "a@b.com",
        "a@mail.b.com",
        "first.last+tag@example.co.uk",
    ])
    func validEmailsPass(_ email: String) {
        #expect(EmailValidator.isValid(email))
    }

    @Test(arguments: ["a-b.com", "", "@b.com", "a@"])
    func invalidEmailsFail(_ email: String) {
        #expect(!EmailValidator.isValid(email))
    }
}
```

## Multiple Argument Sets (Zipped Parameters)

```swift
import Testing

struct PriceCalculatorTests {
    @Test(arguments: [
        (basePrice: 100.0, taxRate: 0.05, expected: 105.0),
        (basePrice: 50.0, taxRate: 0.20, expected: 60.0),
        (basePrice: 0.0, taxRate: 0.10, expected: 0.0),
    ])
    func appliesTaxCorrectly(basePrice: Double, taxRate: Double, expected: Double) {
        let result = PriceCalculator.finalPrice(base: basePrice, taxRate: taxRate)
        #expect(abs(result - expected) < 0.0001)
    }

    // Two independent collections are combined pairwise (zipped).
    @Test(arguments: zip([1, 2, 3], [10, 20, 30]))
    func multipliesPairwise(quantity: Int, unitPrice: Int) {
        #expect(quantity * unitPrice == PriceCalculator.lineTotal(quantity, unitPrice))
    }
}
```

## See Also

- [`test-swift-testing-macro`](test-swift-testing-macro.md) - `@Test` macro fundamentals
- [`test-descriptive-test-names`](test-descriptive-test-names.md) - Naming parameterized cases
- [`test-arrange-act-assert-swift`](test-arrange-act-assert-swift.md) - Structuring each parameterized case
