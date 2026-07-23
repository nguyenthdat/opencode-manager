# test-avoid-force-unwrap-tests

> Even in tests, prefer `#require`/`XCTUnwrap` over force unwrap

## Why It Matters

A force unwrap (`!`) that fails inside a test crashes the entire test process with an unhelpful trap, potentially aborting the rest of the test run and hiding the real assertion location. `#require` (Swift Testing) and `XCTUnwrap` (XCTest) turn a `nil` or thrown error into a normal, well-reported test failure that points at the exact line and lets remaining tests in the suite still execute.

## Bad

```swift
import Testing

struct URLParsingTests {
    @Test
    func parsesQueryItems() {
        let url = URL(string: "https://example.com?id=42")!  // crashes the whole run if nil
        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)!
        let idItem = components.queryItems!.first(where: { $0.name == "id" })!
        #expect(idItem.value == "42")
    }
}
```

## Good

```swift
import Testing

struct URLParsingTests {
    @Test
    func parsesQueryItems() throws {
        let url = try #require(URL(string: "https://example.com?id=42"))
        let components = try #require(URLComponents(url: url, resolvingAgainstBaseURL: false))
        let queryItems = try #require(components.queryItems)
        let idItem = try #require(queryItems.first(where: { $0.name == "id" }))

        #expect(idItem.value == "42")
    }
}
```

## XCTest Equivalent

```swift
import XCTest

final class URLParsingXCTests: XCTestCase {
    func testParsesQueryItems() throws {
        let url = try XCTUnwrap(URL(string: "https://example.com?id=42"))
        let components = try XCTUnwrap(URLComponents(url: url, resolvingAgainstBaseURL: false))
        let queryItems = try XCTUnwrap(components.queryItems)
        let idItem = try XCTUnwrap(queryItems.first(where: { $0.name == "id" }))

        XCTAssertEqual(idItem.value, "42")
    }
}

// If the value under test genuinely being nil/absent IS the assertion,
// express that directly instead of unwrapping it:
final class OptionalAssertionTests: XCTestCase {
    func testMissingUserReturnsNil() {
        let user = UserStore().find(id: "unknown")
        XCTAssertNil(user)
    }
}
```

## See Also

- [`type-no-force-unwrap`](type-no-force-unwrap.md) - Avoiding force unwrap in production code
- [`test-swift-testing-macro`](test-swift-testing-macro.md) - `#require`/`#expect` basics
- [`err-no-force-try`](err-no-force-try.md) - Avoiding `try!` for the same reasons
