# test-fixture-setup-teardown

> Use `init`/`deinit` or `setUp`/`tearDown` for fixture lifecycle

## Why It Matters

Repeating the same setup code inside every test function obscures what's actually being tested and risks subtle inconsistencies between tests. Swift Testing structs get a fresh `init` per test automatically (with `deinit` for cleanup), while XCTest relies on `setUp`/`tearDown` overrides—both exist specifically so fixture lifecycle is written once and applied uniformly.

## Bad

```swift
import Testing

struct DatabaseTests {
    @Test
    func insertingUserIncreasesCount() throws {
        let db = try Database(path: ":memory:") // repeated in every test
        try db.migrate()
        try db.insert(User(name: "Ada"))
        #expect(try db.userCount() == 1)
    }

    @Test
    func deletingUserDecreasesCount() throws {
        let db = try Database(path: ":memory:") // duplicated setup
        try db.migrate()
        try db.insert(User(name: "Ada"))
        try db.delete(name: "Ada")
        #expect(try db.userCount() == 0)
    }
}
```

## Good

```swift
import Testing

struct DatabaseTests {
    let db: Database

    init() throws {
        db = try Database(path: ":memory:")
        try db.migrate()
    }

    @Test
    func insertingUserIncreasesCount() throws {
        try db.insert(User(name: "Ada"))
        #expect(try db.userCount() == 1)
    }

    @Test
    func deletingUserDecreasesCount() throws {
        try db.insert(User(name: "Ada"))
        try db.delete(name: "Ada")
        #expect(try db.userCount() == 0)
    }
}
// Each @Test method gets a fresh DatabaseTests instance, so `init` runs
// before every test—no shared mutable state leaks between tests.
```

## XCTest Equivalent

```swift
import XCTest

final class DatabaseXCTests: XCTestCase {
    var db: Database!

    override func setUpWithError() throws {
        try super.setUpWithError()
        db = try Database(path: ":memory:")
        try db.migrate()
    }

    override func tearDownWithError() throws {
        db = nil
        try super.tearDownWithError()
    }

    func testInsertingUserIncreasesCount() throws {
        try db.insert(User(name: "Ada"))
        XCTAssertEqual(try db.userCount(), 1)
    }
}
```

## See Also

- [`test-swift-testing-macro`](test-swift-testing-macro.md) - Struct-per-test fixture semantics
- [`test-xctest-legacy`](test-xctest-legacy.md) - `setUp`/`tearDown` conventions
- [`test-protocol-mock-injection`](test-protocol-mock-injection.md) - Injecting fixture dependencies
