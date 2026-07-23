# api-struct-over-class-default

> Default to `struct`; justify `class` explicitly

## Why It Matters

At the API-design level, choosing `struct` as the default communicates a promise to callers: values behave independently, are safe to share across threads without synchronization, and equality/comparison work on content rather than identity. Every `class` in a public API is a decision that callers must account for — shared mutation, potential retain cycles, `===` vs `==` confusion — so it should require a specific, stated reason rather than being the reflexive choice from other OOP languages.

## Bad

```swift
// Ported directly from an Objective-C/Java mental model — no part of this
// actually needs reference semantics.
public class Coordinate {
    public var latitude: Double
    public var longitude: Double

    public init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }
}

public class Route {
    public var waypoints: [Coordinate]
    public init(waypoints: [Coordinate]) { self.waypoints = waypoints }
}
```

## Good

```swift
public struct Coordinate: Equatable, Hashable {
    public var latitude: Double
    public var longitude: Double

    public init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }
}

public struct Route: Equatable {
    public var waypoints: [Coordinate]
    public init(waypoints: [Coordinate]) { self.waypoints = waypoints }
}
```

## Documenting the Justification When `class` Is Chosen

When a public API does need a class, state the reason in its documentation so future maintainers don't "fix" it back to a struct without understanding why identity matters:

```swift
/// Represents an active, shared network connection.
///
/// `class` is required here: every part of the app that holds a
/// `Connection` must observe the same underlying socket state and
/// see disconnects/reconnects consistently.
public final class Connection {
    public private(set) var isConnected = false
}
```

## See Also

- [`mem-struct-value-semantics`](mem-struct-value-semantics.md) - the memory-level rationale behind this default
- [`mem-class-when-identity`](mem-class-when-identity.md) - the checklist for when class is justified
- [`api-immutable-by-default`](api-immutable-by-default.md) - pairing structs with `let` for full value semantics
