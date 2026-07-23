# type-optional-chaining

> Use optional chaining `?.` instead of nested `if`s

## Why It Matters

Optional chaining lets you call properties, methods, and subscripts on an optional and automatically returns `nil` if any link in the chain is `nil`, short-circuiting the rest of the expression. This collapses what would otherwise be several nested `if let` checks into a single readable expression, and it composes naturally with `??` and `map`.

## Bad

```swift
func streetName(for user: User?) -> String? {
    if let user = user {
        if let address = user.address {
            if let street = address.street {
                return street.name
            }
        }
    }
    return nil
}
```

## Good

```swift
func streetName(for user: User?) -> String? {
    return user?.address?.street?.name
}
```

## Chaining Into Method Calls and Subscripts

```swift
// Method call through the chain — returns Optional<Void> / Optional<T>
viewController?.navigationController?.popViewController(animated: true)

// Subscript access through the chain
let firstItem = order?.items?[0]

// Combine with nil-coalescing for a default
let city = user?.address?.city ?? "Unknown city"

// Combine with `if let` when you need to act only when the whole chain succeeds
if let street = user?.address?.street?.name {
    print("Lives on \(street)")
}
```

Optional chaining on a chain that calls a throwing or mutating function still works, but be careful: if an earlier link is `nil`, none of the later method calls execute — don't rely on side effects happening as a side channel.

## See Also

- [`type-nil-coalescing`](type-nil-coalescing.md) - pair with ?? for a fallback value
- [`type-optional-map-flatmap`](type-optional-map-flatmap.md) - transform instead of just access
- [`type-guard-let-early`](type-guard-let-early.md) - unwrap explicitly when you need the value for the rest of the function
