# name-protocol-capability-suffix

> Suffix capability protocols with `-able`/`-ible`/`-ing`

## Why It Matters

Protocols describing what a type *can do* read best as adjectives or gerunds—`Equatable`, `Comparable`, `Codable`, `CustomStringConvertible`—so conforming types read naturally at the declaration site: `struct Point: Equatable, Codable`. This distinguishes capability protocols from protocols that describe *what a type is* (nouns like `Collection`, `Sequence`), which should not take the same suffix.

## Bad

```swift
// Capability protocols named as nouns read awkwardly on conformance.
protocol Cache {
    func store(_ value: Data, forKey key: String)
}
// "struct DiskStore: Cache" doesn't read as a capability.

protocol Reset {
    func reset()
}
struct Counter: Reset { ... } // "Counter is Reset"? grammatically odd
```

## Good

```swift
protocol Cacheable {
    func store(_ value: Data, forKey key: String)
}

protocol Resettable {
    func reset()
}
struct Counter: Resettable { ... } // "Counter is Resettable" reads naturally

protocol Retrying {
    func retry() async throws
}
```

## Nouns for Protocols That Describe What a Type Is

```swift
// When a protocol models a role or a kind of thing rather than a capability,
// a noun is correct and should NOT be forced into an -able suffix.
protocol DataSource {
    func numberOfItems() -> Int
}

protocol NetworkSession {
    func send(_ request: URLRequest) async throws -> Data
}

// Standard library follows the same split:
// Sequence, Collection, Iterator -> nouns (role/kind)
// Equatable, Hashable, Comparable, Codable -> capability adjectives
```

## See Also

- [`name-type-upper-camel`](name-type-upper-camel.md) - Casing for protocol names
- [`api-protocol-oriented`](api-protocol-oriented.md) - Designing around protocols
- [`api-existential-any`](api-existential-any.md) - Using capability protocols as existentials
