# api-equatable-hashable-derive

> Derive `Equatable`/`Hashable` instead of hand-rolling

## Why It Matters

The compiler can synthesize correct, field-by-field `==` and `hash(into:)` implementations for any struct or enum whose stored properties are all themselves `Equatable`/`Hashable`, and it keeps that synthesis in sync automatically whenever a property is added, removed, or reordered. A hand-written implementation has to be updated manually every time the type's shape changes, and a forgotten field in `==` or `hash(into:)` produces a subtle bug — two "equal" values that don't compare equal, or a value that hashes inconsistently with `==`.

## Bad

```swift
struct Address {
    let street: String
    let city: String
    let postalCode: String
}

extension Address: Equatable {
    static func == (lhs: Address, rhs: Address) -> Bool {
        lhs.street == rhs.street && lhs.city == rhs.city
        // postalCode silently forgotten — two different addresses in the
        // same city and street now compare as equal
    }
}
```

## Good

```swift
struct Address: Equatable, Hashable {
    let street: String
    let city: String
    let postalCode: String
    // == and hash(into:) synthesized correctly for all three fields,
    // and stay correct automatically if a field is added later
}
```

## When a Custom Implementation Is Actually Needed

Hand-roll only when equality/hashing must intentionally ignore certain fields (e.g. a cache timestamp) or use custom logic (case-insensitive comparison) — and be precise that `==` and `hash(into:)` stay consistent with each other:

```swift
struct CacheEntry: Hashable {
    let key: String
    let value: Data
    let fetchedAt: Date   // deliberately excluded from equality/hash

    static func == (lhs: CacheEntry, rhs: CacheEntry) -> Bool {
        lhs.key == rhs.key && lhs.value == rhs.value
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(key)
        hasher.combine(value)
    }
}
```

## See Also

- [`api-codable-conformance`](api-codable-conformance.md) - the analogous synthesis for serialization
- [`api-immutable-by-default`](api-immutable-by-default.md) - immutable fields make derived equality/hashing safe to rely on
- [`ui-identifiable-list-data`](ui-identifiable-list-data.md) - `Identifiable` often complements `Hashable` for list data
