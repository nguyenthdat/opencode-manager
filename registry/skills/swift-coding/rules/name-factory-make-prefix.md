# name-factory-make-prefix

> Prefix factory methods with `make` when returning a new instance

## Why It Matters

The Swift API Design Guidelines reserve bare noun names (like `x.successor()`) for non-mutating operations that don't allocate, and use a `make`-prefixed verb for factory methods that construct and return a new instance. This distinguishes "give me a new thing" from "compute something from what I already have," and it avoids collisions with initializers when a plain `init` isn't expressive enough (e.g., you need a static context or a differently-labeled variant).

## Bad

```swift
struct ViewFactory {
    // Ambiguous: looks like it might return an existing/cached view.
    static func button(title: String) -> UIButton { ... }

    // Reads like a query, not a constructor.
    static func loadingSpinner() -> UIActivityIndicatorView { ... }
}

extension URLRequest {
    // Sounds like a mutation, but it returns a brand-new request.
    func authorizedRequest(token: String) -> URLRequest { ... }
}
```

## Good

```swift
struct ViewFactory {
    static func makeButton(title: String) -> UIButton { ... }
    static func makeLoadingSpinner() -> UIActivityIndicatorView { ... }
}

extension URLRequest {
    func makingAuthorized(token: String) -> URLRequest { ... }
    // or, following the mutating/ed convention when it reads as an adjective transform:
    // func authorized(token: String) -> URLRequest { ... }
}

enum ConnectionFactory {
    static func makeConnection(to host: String, port: Int) throws -> Connection {
        try Connection(host: host, port: port)
    }
}
```

## When a Plain Initializer Is Better

```swift
// Prefer `init` over `makeX()` when the type itself is the natural spelling
// of construction and there's no ambiguity.
struct Point {
    init(x: Double, y: Double) { ... }
}
let origin = Point(x: 0, y: 0) // not Point.makePoint(x:y:)

// Reach for `make` when a static/free function is the only sensible shape,
// e.g. protocol factories, or multiple named construction strategies.
protocol ViewControllerFactory {
    func makeDetailViewController(for item: Item) -> UIViewController
    func makeSettingsViewController() -> UIViewController
}
```

## See Also

- [`name-func-lower-camel`](name-func-lower-camel.md) - Casing convention that `make` names follow
- [`name-mutating-ed-pairs`](name-mutating-ed-pairs.md) - Verb/adjective pairing for transforms
- [`api-argument-labels-clarity`](api-argument-labels-clarity.md) - Labeling factory parameters
