# test-async-test-function

> Write `async throws` test functions for concurrency code

## Why It Matters

Testing `async` production code from a synchronous test function forces awkward workarounds like `XCTestExpectation` or blocking semaphores, which are slower, harder to read, and can deadlock if misused. Both Swift Testing's `@Test` and XCTest support `async throws` test functions directly, letting you `await` the code under test exactly as callers would.

## Bad

```swift
import XCTest

final class DataLoaderTests: XCTestCase {
    func testLoadFetchesData() {
        let expectation = expectation(description: "load completes")
        var result: [Item] = []

        Task {
            result = try! await DataLoader().load() // force-try inside a Task, errors vanish
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 5)
        XCTAssertFalse(result.isEmpty)
    }
}
```

## Good

```swift
import Testing

struct DataLoaderTests {
    @Test
    func loadFetchesData() async throws {
        let items = try await DataLoader().load()
        #expect(!items.isEmpty)
    }
}

// XCTest equivalent
import XCTest

final class DataLoaderXCTests: XCTestCase {
    func testLoadFetchesData() async throws {
        let items = try await DataLoader().load()
        XCTAssertFalse(items.isEmpty)
    }
}
```

## Testing Timeouts and Cancellation

```swift
import Testing

struct DataLoaderTimeoutTests {
    @Test
    func loadTimesOutForSlowServer() async throws {
        let loader = DataLoader(session: SlowMockSession())

        await #expect(throws: LoaderError.timeout) {
            try await loader.load(timeout: .milliseconds(50))
        }
    }

    @Test
    func loadRespectsCancellation() async throws {
        let task = Task {
            try await DataLoader().load()
        }
        task.cancel()

        await #expect(throws: CancellationError.self) {
            try await task.value
        }
    }
}
```

## See Also

- [`test-swift-testing-macro`](test-swift-testing-macro.md) - `@Test` macro basics
- [`test-confirmation-async-events`](test-confirmation-async-events.md) - Verifying async event streams
- [`async-task-cancellation-check`](async-task-cancellation-check.md) - Cancellation semantics under test
