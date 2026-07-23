# mem-final-class-default

> Mark classes `final` unless designed for subclassing

## Why It Matters

An open-for-subclassing class must keep every overridable method's behavior stable across future changes, since subclasses may depend on calling `super` or overriding specific methods in specific ways — this quietly locks in an inheritance contract nobody explicitly designed. `final` also lets the compiler devirtualize method calls and inline more aggressively, since it knows no subclass can override them, which is a real (if secondary) performance win in hot paths.

## Bad

```swift
class NetworkClient {
    func send(_ request: URLRequest) async throws -> Data {
        try await URLSession.shared.data(for: request).0
    }

    func retry(_ request: URLRequest, times: Int) async throws -> Data {
        try await send(request)   // subclasses can silently redefine `send`'s contract
    }
}

// Nothing prevented this from ever happening, and now NetworkClient's
// behavior depends on undocumented subclass overrides across the codebase.
final class LoggingNetworkClient: NetworkClient {
    override func send(_ request: URLRequest) async throws -> Data {
        print("sending \(request)")
        return try await super.send(request)
    }
}
```

## Good

```swift
final class NetworkClient {
    func send(_ request: URLRequest) async throws -> Data {
        try await URLSession.shared.data(for: request).0
    }

    func retry(_ request: URLRequest, times: Int) async throws -> Data {
        try await send(request)
    }
}

// Cross-cutting behavior (logging, retries) is composed instead of inherited:
struct LoggingDecorator {
    let client: NetworkClient

    func send(_ request: URLRequest) async throws -> Data {
        print("sending \(request)")
        return try await client.send(request)
    }
}
```

## When Subclassing Is Genuinely the Right Tool

Some frameworks (UIKit view controllers, `NSObject`-based APIs, template-method base classes you own and intentionally design for extension) still call for open classes. In that case, be explicit about which methods are extension points and mark the rest `final`:

```swift
class BaseViewController: UIViewController {
    final override func viewDidLoad() {
        super.viewDidLoad()
        configureLayout()   // extension point
    }

    func configureLayout() {
        // subclasses override this specific hook, nothing else
    }
}
```

## See Also

- [`api-composition-over-inheritance`](api-composition-over-inheritance.md) - preferring composition to solve what inheritance is often reached for
- [`mem-class-when-identity`](mem-class-when-identity.md) - deciding whether a class is needed at all
- [`anti-massive-view-controller`](anti-massive-view-controller.md) - open inheritance hierarchies are a common source of God objects
