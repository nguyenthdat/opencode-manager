# type-nil-coalescing

> Use `??` for default values instead of force unwrap

## Why It Matters

The nil-coalescing operator `??` supplies a fallback value in a single expression, avoiding both a crash-prone force unwrap and a verbose `if let`/`else` just to pick a default. It keeps default-value logic inline and readable, and composes well with chained optionals.

## Bad

```swift
func displayName(for user: User) -> String {
    // Crashes if nickname is nil
    return user.nickname!
}

func timeout(from config: Config?) -> TimeInterval {
    if let config = config, let value = config.timeoutOverride {
        return value
    } else {
        return 30
    }
}
```

## Good

```swift
func displayName(for user: User) -> String {
    return user.nickname ?? user.fullName
}

func timeout(from config: Config?) -> TimeInterval {
    return config?.timeoutOverride ?? 30
}
```

## Chaining ?? and Short-Circuiting

`??` is right-associative and short-circuits, so you can chain multiple fallbacks and only the ones needed are evaluated:

```swift
let title = customTitle ?? remoteTitle ?? "Untitled"

// The right-hand side can be a throwing/expensive expression;
// it's only evaluated if the left side is nil.
let cached = cache[key] ?? computeExpensiveDefault()
```

Avoid using `??` to paper over a `nil` that actually signals a bug — if `nil` should never happen, a force unwrap with a documented invariant (or `precondition`) communicates intent better than silently substituting a default.

## See Also

- [`type-no-force-unwrap`](type-no-force-unwrap.md) - avoid force unwrap outside proven invariants
- [`type-optional-chaining`](type-optional-chaining.md) - combine with ?. for chained optionals
- [`type-non-optional-default`](type-non-optional-default.md) - prefer non-optional properties with defaults
