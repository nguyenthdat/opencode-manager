# type-guard-let-early

> Use `guard let` for early-exit unwrapping

## Why It Matters

`guard let` unwraps an optional and forces you to exit the current scope (`return`, `throw`, `continue`, `break`) in the `else` branch, keeping the unwrapped value available for the rest of the function. This flattens deeply nested `if let` pyramids, keeps the "happy path" unindented, and makes missing-value handling explicit instead of an afterthought.

## Bad

```swift
func summary(for user: User?) -> String {
    if let user = user {
        if let profile = user.profile {
            if let bio = profile.bio {
                return bio
            } else {
                return "No bio"
            }
        } else {
            return "No profile"
        }
    } else {
        return "No user"
    }
}
```

## Good

```swift
func summary(for user: User?) -> String {
    guard let user = user else { return "No user" }
    guard let profile = user.profile else { return "No profile" }
    guard let bio = profile.bio else { return "No bio" }
    return bio
}
```

## When Nested if let Is Still Fine

Short-circuit checks that don't need to exit the function (e.g. deciding between two branches that both continue execution) read better as `if let`/`else`, since there's no early return to perform:

```swift
func greeting(for user: User?) -> String {
    if let name = user?.name {
        return "Hello, \(name)!"
    } else {
        return "Hello, stranger!"
    }
}
```

Reach for `guard let` specifically when the failure case should short-circuit the rest of the function, a loop iteration, or a closure — not for every optional unwrap.

## See Also

- [`type-if-let-narrow`](type-if-let-narrow.md) - use if let when the value is only needed locally
- [`type-multi-optional-binding`](type-multi-optional-binding.md) - combine several guard let bindings
- [`type-no-force-unwrap`](type-no-force-unwrap.md) - avoid force unwrap instead of guarding
