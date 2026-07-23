# test-uitest-separate-target

> Keep UI tests in a separate XCUITest target from unit tests

## Why It Matters

UI tests launch a full app process, drive it through the accessibility tree, and take seconds per test, while unit tests run in-process in milliseconds. Mixing them in one target forces every CI run and local test invocation to pay the UI tests' cost even when only unit-level coverage is needed, and a single flaky UI test can block fast unit-test feedback loops.

## Bad

```
MyApp.xcodeproj
├── MyApp/
├── MyAppTests/                 // unit tests AND UI tests mixed together
│   ├── UserServiceTests.swift        (fast, in-process XCTestCase)
│   ├── LoginFlowUITests.swift        (slow, launches XCUIApplication)
│   └── CheckoutFlowUITests.swift     (slow, launches XCUIApplication)
```

```swift
// Running `xcodebuild test -only-testing:MyAppTests/UserServiceTests`
// still builds the UI-test-capable target and its XCUIApplication dependencies,
// slowing down what should be a fast unit-test loop.
```

## Good

```
MyApp.xcodeproj
├── MyApp/
├── MyAppTests/                 // unit tests only, fast, run on every commit
│   └── UserServiceTests.swift
├── MyAppUITests/                // UI tests only, separate target, run on PR/nightly
│   ├── LoginFlowUITests.swift
│   └── CheckoutFlowUITests.swift
```

```swift
// MyAppTests/UserServiceTests.swift
import XCTest
@testable import MyApp

final class UserServiceTests: XCTestCase {
    func testCreateUserPersistsToStore() {
        let service = UserService(store: InMemoryStore())
        let user = service.createUser(name: "Ada")
        XCTAssertEqual(service.fetchUser(id: user.id)?.name, "Ada")
    }
}

// MyAppUITests/LoginFlowUITests.swift
import XCTest

final class LoginFlowUITests: XCTestCase {
    func testSuccessfulLoginShowsHomeScreen() {
        let app = XCUIApplication()
        app.launch()
        app.textFields["emailField"].tap()
        app.textFields["emailField"].typeText("ada@example.com")
        app.buttons["Sign In"].tap()
        XCTAssertTrue(app.staticTexts["HomeTitle"].waitForExistence(timeout: 5))
    }
}
```

## CI Scheme Separation

```swift
// Split schemes so CI can run unit tests on every push and UI tests
// on a separate, less frequent job (e.g. pre-merge or nightly):
//
// xcodebuild test -scheme MyApp-UnitTests   -destination 'platform=iOS Simulator,name=iPhone 15'
// xcodebuild test -scheme MyApp-UITests     -destination 'platform=iOS Simulator,name=iPhone 15'
```

## See Also

- [`test-xctest-legacy`](test-xctest-legacy.md) - XCTest/XCUITest conventions
- [`proj-target-test-mirror`](proj-target-test-mirror.md) - Mirroring source targets with test targets
- [`test-fixture-setup-teardown`](test-fixture-setup-teardown.md) - App launch/teardown in UI tests
