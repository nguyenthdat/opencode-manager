# anti-singleton-overuse

> Don't reach for singletons as the default dependency access pattern

## Why It Matters

A `.shared` singleton is a piece of implicit global state: any type that reaches for it has an invisible dependency that doesn't appear in its initializer, can't be swapped out in tests, and silently couples every consumer to the same shared instance whether or not that's actually desired. Once several unrelated features all read and write the same singleton's mutable state, reasoning about ordering and side effects becomes a whole-codebase problem instead of a local one, and writing a unit test means either accepting global mutable state bleeding between tests or reaching for elaborate singleton-reset hacks.

## Bad

```swift
final class UserSession {
    static let shared = UserSession()
    var currentUser: User?
    private init() {}
}

struct ProfileViewModel {
    func loadProfile() -> Profile? {
        guard let user = UserSession.shared.currentUser else { return nil }
        // hidden dependency: not visible in ProfileViewModel's initializer,
        // impossible to substitute a test user without mutating global state
        return Profile(user: user)
    }
}
```

## Good

```swift
protocol UserSessionProviding {
    var currentUser: User? { get }
}

struct ProfileViewModel {
    private let sessionProvider: UserSessionProviding

    init(sessionProvider: UserSessionProviding) {
        self.sessionProvider = sessionProvider
    }

    func loadProfile() -> Profile? {
        guard let user = sessionProvider.currentUser else { return nil }
        return Profile(user: user)
    }
}

// Test: inject a fake, no global state to reset between tests.
struct FakeSessionProvider: UserSessionProviding {
    var currentUser: User?
}

let viewModel = ProfileViewModel(sessionProvider: FakeSessionProvider(currentUser: .mock))
```

## When a Shared Instance Is Legitimate

Some things genuinely are process-wide singletons by the platform's own design — `UIApplication.shared`, `URLSession.shared` as a default configuration, a single `NotificationCenter.default`. Wrapping platform-mandated singletons behind an injectable protocol at your app's boundary (rather than calling `.shared` directly from business logic) still keeps the rest of the codebase testable, even when the underlying resource really is global:

```swift
protocol URLSessionProtocol { func data(for: URLRequest) async throws -> (Data, URLResponse) }
extension URLSession: URLSessionProtocol {}   // production code injects URLSession.shared once, at composition time
```

## See Also

- [`test-protocol-mock-injection`](test-protocol-mock-injection.md) - the dependency-injection pattern this rule supports
- [`api-protocol-oriented`](api-protocol-oriented.md) - designing around protocols instead of concrete shared instances
- [`async-actor-isolated-state`](async-actor-isolated-state.md) - if shared mutable state is truly required, isolate it in an actor rather than a plain singleton
