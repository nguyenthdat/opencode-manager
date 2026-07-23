# type-if-let-narrow

> Use `if let` to narrow optional scope locally

## Why It Matters

`if let` scopes the unwrapped value to a single branch instead of the rest of the function, which is exactly right when the optional is only relevant to one code path and both branches continue executing afterward. Overusing `guard let` when you don't actually need an early exit makes functions harder to follow because the reader has to track why control flow bails out.

## Bad

```swift
func render(_ cachedImage: UIImage?) -> UIImage {
    guard let cachedImage = cachedImage else {
        return placeholderImage
    }
    // cachedImage is now polluting scope for a value only used once,
    // and the "guard" implies an error condition that isn't one here.
    return cachedImage
}
```

## Good

```swift
func render(_ cachedImage: UIImage?) -> UIImage {
    if let cachedImage {
        return cachedImage
    }
    return placeholderImage
}
```

## Shorthand Optional Binding (Swift 5.7+)

When the local name matches the optional's name, use the shorthand form instead of repeating `= cachedImage`:

```swift
var errorMessage: String?

if let errorMessage {
    log(errorMessage)
}

// Equivalent to the pre-5.7 spelling:
if let errorMessage = errorMessage {
    log(errorMessage)
}
```

Use `if let` when you need the unwrapped value in only one branch, `guard let` when the rest of the function depends on it being non-nil.

## See Also

- [`type-guard-let-early`](type-guard-let-early.md) - prefer guard let for early exits
- [`type-multi-optional-binding`](type-multi-optional-binding.md) - combine bindings in one if let
- [`type-optional-pattern-match`](type-optional-pattern-match.md) - switch/case let pattern matching
