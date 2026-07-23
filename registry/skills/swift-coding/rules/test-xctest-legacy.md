# test-xctest-legacy

> Use XCTest conventions for existing suites and UI tests

## Why It Matters

XCTest remains required for UI automation (`XCUIApplication`), performance tests (`measure {}`), and any existing large test suite where a full migration to Swift Testing isn't yet justified. Mixing conventions haphazardly within one XCTest suite—some `test`-prefixed methods, some not, inconsistent `XCTAssert` usage—makes the suite harder for the whole team to navigate and for Xcode's test discovery to run reliably.

## Bad

```swift
import XCTest

class UserServiceTests: XCTestCase {
    // Missing "test" prefix: Xcode/XCTest won't discover this as a test.
    func checkUserCreation() {
        let user = UserService().createUser(name: "Ada")
        XCTAssertNotNil(user)
    }

    func testLogin() {
        // No setUp; state leaks between tests via a shared singleton.
        AppState.shared.login(as: "ada@example.com")
        XCTAssertTrue(AppState.shared.isLoggedIn)
    }
}
```

## Good

```swift
import XCTest

final class UserServiceTests: XCTestCase {
    var sut: UserService!

    override func setUpWithError() throws {
        try super.setUpWithError()
        sut = UserService()
    }

    override func tearDownWithError() throws {
        sut = nil
        try super.tearDownWithError()
    }

    func testUserCreationSucceeds() {
        let user = sut.createUser(name: "Ada")
        XCTAssertNotNil(user)
    }

    func testLoginSetsAuthenticatedState() {
        let session = sut.login(email: "ada@example.com")
        XCTAssertTrue(session.isAuthenticated)
    }
}
```

## UI Tests Stay on XCTest/XCUITest

```swift
import XCTest

final class LoginFlowUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
    }

    func testSuccessfulLoginNavigatesToHome() {
        let app = XCUIApplication()
        app.textFields["emailField"].tap()
        app.textFields["emailField"].typeText("ada@example.com")
        app.secureTextFields["passwordField"].tap()
        app.secureTextFields["passwordField"].typeText("s3cret")
        app.buttons["Sign In"].tap()

        XCTAssertTrue(app.staticTexts["HomeTitle"].waitForExistence(timeout: 5))
    }
}
```

## See Also

- [`test-swift-testing-macro`](test-swift-testing-macro.md) - New suites should prefer `@Test`
- [`test-uitest-separate-target`](test-uitest-separate-target.md) - Keeping UI tests in their own target
- [`test-fixture-setup-teardown`](test-fixture-setup-teardown.md) - Fixture lifecycle patterns
