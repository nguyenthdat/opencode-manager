# type-multi-optional-binding

> Combine multiple bindings in a single `if let`/`guard let`

## Why It Matters

Swift allows multiple optional bindings and boolean conditions in one `if`/`guard` clause, separated by commas, with later clauses able to reference earlier unwrapped values. Chaining separate `guard let`/`if let` statements for related optionals adds indentation or repeated boilerplate for no benefit, and obscures that the checks are logically one precondition.

## Bad

```swift
func makeAddress(street: String?, city: String?, zip: String?) -> Address? {
    guard let street = street else { return nil }
    guard let city = city else { return nil }
    guard let zip = zip else { return nil }
    return Address(street: street, city: city, zip: zip)
}
```

## Good

```swift
func makeAddress(street: String?, city: String?, zip: String?) -> Address? {
    guard let street, let city, let zip else { return nil }
    return Address(street: street, city: city, zip: zip)
}
```

## Mixing Bindings With Boolean Conditions

```swift
func fetchNextPage(cursor: String?, hasMore: Bool, pageSize: Int) -> URLRequest? {
    guard let cursor, hasMore, pageSize > 0 else {
        return nil
    }
    return buildRequest(cursor: cursor, pageSize: pageSize)
}

// Later clauses can depend on earlier unwrapped values
func validatedRange(lower: Int?, upper: Int?) -> ClosedRange<Int>? {
    guard let lower, let upper, lower <= upper else {
        return nil
    }
    return lower...upper
}
```

Combine bindings whenever they represent one logical precondition — it keeps the `else` block honest (there is exactly one failure path to reason about) instead of implying several independent ones.

## See Also

- [`type-guard-let-early`](type-guard-let-early.md) - the early-exit form this builds on
- [`type-if-let-narrow`](type-if-let-narrow.md) - the narrowing form this builds on
- [`type-optional-pattern-match`](type-optional-pattern-match.md) - pattern-based alternative for enums
