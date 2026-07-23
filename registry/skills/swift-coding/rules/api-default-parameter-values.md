# api-default-parameter-values

> Use default parameter values instead of overloads

## Why It Matters

A family of overloaded functions that only differ by a trailing parameter or two forces callers to keep track of which overload does what, and forces maintainers to keep every overload's behavior in sync manually. A single function with default parameter values gives the same convenient call-site shorthand (omit what you don't need) while guaranteeing there is exactly one implementation to reason about and maintain.

## Bad

```swift
func fetchUsers() -> [User] {
    fetchUsers(limit: 20, includeInactive: false)
}

func fetchUsers(limit: Int) -> [User] {
    fetchUsers(limit: limit, includeInactive: false)
}

func fetchUsers(limit: Int, includeInactive: Bool) -> [User] {
    // the actual implementation — the other two overloads exist purely
    // to fill in defaults, and could easily drift out of sync
    []
}
```

## Good

```swift
func fetchUsers(limit: Int = 20, includeInactive: Bool = false) -> [User] {
    // single implementation; callers omit whatever they don't need to customize
    []
}

fetchUsers()
fetchUsers(limit: 50)
fetchUsers(limit: 50, includeInactive: true)
```

## When Separate Overloads Are Still the Right Tool

Reach for genuine overloads (not defaults) when the parameter's *type*, not just its value, differs, or when the overloads represent meaningfully different call shapes rather than "the same thing with an omitted argument":

```swift
func distance(to point: CGPoint) -> CGFloat { /* ... */ 0 }
func distance(to rect: CGRect) -> CGFloat { /* ... */ 0 }
```

Avoid combining default parameters with unrelated overloads of the same name — that mixture is exactly what makes call sites ambiguous to read and to type-check.

## See Also

- [`api-argument-labels-clarity`](api-argument-labels-clarity.md) - keeping the resulting call sites readable
- [`name-clarity-call-site`](name-clarity-call-site.md) - the broader call-site design principle
- [`api-access-control-minimal`](api-access-control-minimal.md) - keeping the single implementation's internals hidden
