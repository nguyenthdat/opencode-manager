# test-swift-testing-macro

> Use the `@Test` macro (Swift Testing) for new test suites

## Why It Matters

Swift Testing's `@Test` macro replaces XCTest's `test`-prefix convention and boilerplate `XCTAssert` calls with expressive macros (`#expect`, `#require`) that capture the full expression on failure, including operand values. New test suites benefit from clearer failure messages, native parameterization, and structured concurrency support without subclassing `XCTestCase`.

## Bad

```swift
import XCTest

final class CalculatorTests: XCTestCase {
    func testAddition() {
        let result = Calculator().add(2, 3)
        XCTAssertEqual(result, 5) // failure message just says "5 is not equal to 6"
    }

    func testDivisionByZeroThrows() {
        XCTAssertThrowsError(try Calculator().divide(4, by: 0))
    }
}
```

## Good

```swift
import Testing

struct CalculatorTests {
    @Test
    func addition() {
        let result = Calculator().add(2, 3)
        #expect(result == 5) // failure captures both operand values automatically
    }

    @Test
    func divisionByZeroThrows() {
        #expect(throws: DivisionError.self) {
            try Calculator().divide(4, by: 0)
        }
    }
}
```

## Suite Organization with `@Suite`

```swift
import Testing

@Suite("Calculator behavior")
struct CalculatorSuite {
    let calculator = Calculator()

    @Test("Adds two positive numbers")
    func addsPositives() {
        #expect(calculator.add(2, 3) == 5)
    }

    @Test("Subtracts correctly", arguments: [(5, 3, 2), (10, 4, 6)])
    func subtracts(minuend: Int, subtrahend: Int, expected: Int) {
        #expect(calculator.subtract(minuend, subtrahend) == expected)
    }
}
```

## See Also

- [`test-xctest-legacy`](test-xctest-legacy.md) - When to keep using XCTest
- [`test-expectation-parameterized`](test-expectation-parameterized.md) - Parameterized `@Test(arguments:)`
- [`test-descriptive-test-names`](test-descriptive-test-names.md) - Naming tests with display strings
- [`test-avoid-force-unwrap-tests`](test-avoid-force-unwrap-tests.md) - Using `#require` safely
