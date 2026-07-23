# name-generic-placeholder

> Use single-letter generics for simple cases, descriptive names otherwise

## Why It Matters

A single letter like `T` or `Element` works when a generic parameter's role is obvious from context (a single unconstrained placeholder in a small function), but becomes a liability once a type has multiple generic parameters or constraints—readers then need descriptive names like `Key`/`Value` to know which placeholder plays which role.

## Bad

```swift
// Multiple single letters with no semantic hint about their roles.
struct Cache<T, U, V> {
    var storage: [T: U]
    var evictionPolicy: V
}

func merge<T, U>(_ a: [T: U], _ b: [T: U], resolver: (U, U) -> U) -> [T: U] { ... }

// A single letter that hides an important constraint.
func process<T: Codable & Sendable>(_ items: [T]) { ... }
```

## Good

```swift
// Descriptive names once there's more than one parameter or a specific role.
struct Cache<Key: Hashable, Value, Policy: EvictionPolicy> {
    var storage: [Key: Value]
    var evictionPolicy: Policy
}

func merge<Key, Value>(
    _ first: [Key: Value],
    _ second: [Key: Value],
    resolver: (Value, Value) -> Value
) -> [Key: Value] { ... }

// A single T is fine for a simple, single-purpose generic function.
func identity<T>(_ value: T) -> T { value }

func firstElement<T>(of array: [T]) -> T? { array.first }
```

## Stdlib Convention

```swift
// The standard library itself mixes both styles depending on complexity:
extension Sequence {
    func map<T>(_ transform: (Element) -> T) -> [T] { ... } // simple: T is fine
}

protocol Collection: Sequence {
    associatedtype Element   // descriptive: it has a specific semantic role
    associatedtype Index: Comparable
}

struct Dictionary<Key: Hashable, Value> { ... } // descriptive: two distinct roles
```

## See Also

- [`name-type-upper-camel`](name-type-upper-camel.md) - Casing for generic placeholders
- [`api-protocol-associated-type`](api-protocol-associated-type.md) - Naming associated types
- [`name-avoid-abbreviation`](name-avoid-abbreviation.md) - Avoid unclear abbreviations
