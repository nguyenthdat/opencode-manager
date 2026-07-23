# test-confirmation-async-events

> Use `Confirmation`/expectations for async event verification

## Why It Matters

Callback- or delegate-based APIs fire events on their own schedule, so a test can't simply `await` a return value to know the event happened. Swift Testing's `confirmation()` (and XCTest's `XCTestExpectation`) give the test a token it can wait on, with a timeout, so the test fails clearly if the expected number of events never arrives—rather than passing vacuously because nothing was ever asserted.

## Bad

```swift
import Testing

struct NotificationCenterTests {
    @Test
    func postsUpdateNotification() async throws {
        var received = false
        let observer = NotificationCenter.default.addObserver(forName: .dataUpdated, object: nil, queue: nil) { _ in
            received = true // set on a possibly different thread/timing, no synchronization
        }
        defer { NotificationCenter.default.removeObserver(observer) }

        DataStore.shared.update()
        try await Task.sleep(for: .milliseconds(50)) // flaky guess at timing
        #expect(received)
    }
}
```

## Good

```swift
import Testing

struct NotificationCenterTests {
    @Test
    func postsUpdateNotification() async throws {
        try await confirmation("data updated notification fires") { confirm in
            let observer = NotificationCenter.default.addObserver(forName: .dataUpdated, object: nil, queue: nil) { _ in
                confirm()
            }
            defer { NotificationCenter.default.removeObserver(observer) }

            DataStore.shared.update()
        }
    }
}
```

## Confirming an Exact Count, and the XCTest Equivalent

```swift
import Testing

struct WebSocketClientTests {
    @Test
    func receivesExactlyThreeMessages() async throws {
        try await confirmation("message received", expectedCount: 3) { confirm in
            let client = WebSocketClient { _ in confirm() }
            client.connect()
            try await client.send(count: 3)
        }
    }
}

// XCTest equivalent using XCTestExpectation:
import XCTest

final class WebSocketClientXCTests: XCTestCase {
    func testReceivesExactlyThreeMessages() {
        let expectation = expectation(description: "message received")
        expectation.expectedFulfillmentCount = 3

        let client = WebSocketClient { _ in expectation.fulfill() }
        client.connect()
        client.send(count: 3)

        wait(for: [expectation], timeout: 2)
    }
}
```

## See Also

- [`test-async-test-function`](test-async-test-function.md) - `async throws` test functions
- [`test-swift-testing-macro`](test-swift-testing-macro.md) - `@Test` macro basics
- [`async-continuation-bridge`](async-continuation-bridge.md) - Bridging callback APIs into `async`
