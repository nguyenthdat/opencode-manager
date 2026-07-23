# mem-deinit-verify

> Verify deinitialization with logging/tests for lifecycle-critical types

## Why It Matters

Retain cycles and forgotten `weak`/cleanup are invisible at compile time and often invisible at runtime too — a leaked object just quietly keeps consuming memory and, worse, may keep observers, timers, or network connections alive long after the feature that created it is gone. Adding a `deinit` (even just for logging) to lifecycle-critical types turns an invisible leak into an observable signal: if the log line never prints, or a test's weak-reference assertion fails, you know immediately that ownership is wrong.

## Bad

```swift
final class SessionController {
    let socket = WebSocketConnection()
    var onMessage: ((String) -> Void)?

    func start() {
        socket.onReceive = { message in
            self.onMessage?(message)   // strong capture — no `deinit` to reveal the leak
        }
    }
    // no deinit at all: if this leaks, nothing in the app ever tells you
}
```

## Good

```swift
final class SessionController {
    let socket = WebSocketConnection()
    var onMessage: ((String) -> Void)?

    func start() {
        socket.onReceive = { [weak self] message in
            self?.onMessage?(message)
        }
    }

    deinit {
        socket.disconnect()
        #if DEBUG
        print("SessionController deinitialized")
        #endif
    }
}
```

## Testing Deallocation Explicitly

For lifecycle-critical types, assert deallocation directly in tests using a weak reference so a regression fails the build instead of silently leaking in production:

```swift
import Testing
@testable import MyApp

@Test func sessionControllerDeallocatesAfterStop() {
    weak var weakController: SessionController?

    do {
        let controller = SessionController()
        controller.start()
        weakController = controller
        controller.stop()
    }   // `controller` (the only strong reference) goes out of scope here

    #expect(weakController == nil, "SessionController leaked — check closure captures")
}
```

Reserve this pattern for types where a leak has real cost (view controllers, coordinators, connections, anything holding OS resources) rather than adding `deinit` logging everywhere, which adds noise without proportional benefit.

## See Also

- [`mem-weak-self-closure`](mem-weak-self-closure.md) - the most common source of the cycles this rule catches
- [`mem-avoid-retain-cycle-timer`](mem-avoid-retain-cycle-timer.md) - another frequent leak source to verify against
- [`test-fixture-setup-teardown`](test-fixture-setup-teardown.md) - structuring the test lifecycle around such checks
