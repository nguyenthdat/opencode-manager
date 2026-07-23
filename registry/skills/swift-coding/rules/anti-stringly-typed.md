# anti-stringly-typed

> Don't model structured data as raw strings

## Why It Matters

Representing a closed set of states, a routing destination, or a notification name as a bare `String` throws away every compiler guarantee Swift's type system offers: no exhaustiveness checking, no autocomplete, no compile-time typo detection, and no way to `switch` exhaustively. A typo in a string literal (`"pendign"` instead of `"pending"`) compiles cleanly and fails silently at runtime, often in a code path that's rarely exercised until it matters — a state comparison that never matches, a notification nobody's observing because the name doesn't quite line up.

## Bad

```swift
struct Order {
    var status: String   // "pending", "shipped", "delivered", "cancelld" (typo compiles fine)
}

func process(_ order: Order) {
    if order.status == "pending" {
        // ...
    } else if order.status == "shiped" {   // typo — this branch silently never runs
        // ...
    }
}

NotificationCenter.default.post(name: Notification.Name("userDidLogin"), object: nil)
// Elsewhere, a typo means this observer never fires:
NotificationCenter.default.addObserver(forName: Notification.Name("userDidLogIn"), ...)
```

## Good

```swift
enum OrderStatus {
    case pending, shipped, delivered, cancelled
}

struct Order {
    var status: OrderStatus
}

func process(_ order: Order) {
    switch order.status {
    case .pending: /* ... */ break
    case .shipped: /* ... */ break
    case .delivered: /* ... */ break
    case .cancelled: /* ... */ break
    }
    // compiler enforces exhaustiveness — a typo simply cannot compile
}

extension Notification.Name {
    static let userDidLogin = Notification.Name("userDidLogin")
}

NotificationCenter.default.post(name: .userDidLogin, object: nil)
NotificationCenter.default.addObserver(forName: .userDidLogin, ...) { _ in }
// Both sides reference the same compiler-checked constant — no typo possible.
```

## Where a Raw String Genuinely Belongs

Free-form user input, display text, and genuinely external identifiers (a server-assigned opaque ID with no client-side structure) are legitimately strings — don't over-model data that has no closed set of valid values. The anti-pattern is specifically representing *closed, enumerable* domain concepts as strings, not strings in general.

## See Also

- [`type-enum-associated-values`](type-enum-associated-values.md) - the positive-form modeling technique for closed states
- [`type-optional-pattern-match`](type-optional-pattern-match.md) - pattern matching that pairs naturally with enum-based modeling
- [`interop-objc-enum-bridging`](interop-objc-enum-bridging.md) - the Objective-C bridging analog, `NS_ENUM`/`NS_OPTIONS`
- [`api-codable-conformance`](api-codable-conformance.md) - decoding raw string/JSON payloads into these structured types at the boundary
