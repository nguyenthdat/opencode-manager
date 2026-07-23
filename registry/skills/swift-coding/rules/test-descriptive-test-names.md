# test-descriptive-test-names

> Name tests descriptively with `@Test("description")`

## Why It Matters

A test named `testCase1` or `test1` tells a failing-build reader nothing about what broke; they have to open the test body to learn what behavior is under test. Swift Testing's `@Test("...")` display name (and equally, a well-named XCTest method) turns a red X in the test navigator or CI log into a sentence that explains the failure at a glance.

## Bad

```swift
import Testing

struct AuthTests {
    @Test
    func test1() {
        #expect(Auth.login(user: "ada", password: "wrong") == nil)
    }

    @Test
    func test2() {
        #expect(Auth.login(user: "ada", password: "correct") != nil)
    }

    @Test
    func testEdgeCase() {
        #expect(Auth.login(user: "", password: "") == nil)
    }
}
```

## Good

```swift
import Testing

struct AuthTests {
    @Test("Login fails with an incorrect password")
    func loginFailsWithIncorrectPassword() {
        #expect(Auth.login(user: "ada", password: "wrong") == nil)
    }

    @Test("Login succeeds with the correct password")
    func loginSucceedsWithCorrectPassword() {
        #expect(Auth.login(user: "ada", password: "correct") != nil)
    }

    @Test("Login rejects empty username and password")
    func loginRejectsEmptyCredentials() {
        #expect(Auth.login(user: "", password: "") == nil)
    }
}
```

## Naming Parameterized Tests

```swift
import Testing

struct DiscountTests {
    @Test(
        "Discount tiers apply the correct percentage",
        arguments: [
            (orderTotal: 50.0, expectedDiscount: 0.0),
            (orderTotal: 150.0, expectedDiscount: 0.05),
            (orderTotal: 500.0, expectedDiscount: 0.10),
        ]
    )
    func discountAppliesByTier(orderTotal: Double, expectedDiscount: Double) {
        #expect(Discount.rate(forOrderTotal: orderTotal) == expectedDiscount)
    }
}

// XCTest equivalent: method name itself must carry the description,
// since there's no separate display-name argument.
final class DiscountXCTests: XCTestCase {
    func testDiscountIsZeroForOrdersUnder100() { ... }
    func testDiscountIsFivePercentForOrdersOver100() { ... }
}
```

## See Also

- [`test-swift-testing-macro`](test-swift-testing-macro.md) - `@Test` macro fundamentals
- [`test-expectation-parameterized`](test-expectation-parameterized.md) - Parameterized test cases
- [`test-arrange-act-assert-swift`](test-arrange-act-assert-swift.md) - Structuring the body the name describes
