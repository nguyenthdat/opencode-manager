# err-rethrows-generic

> Use `rethrows` for higher-order functions forwarding closure errors

## Why It Matters

A higher-order function that calls a throwing closure but never throws on its own should be marked `rethrows` instead of `throws`. `rethrows` tells the compiler (and the caller) that the function only throws if its closure argument throws, which means callers passing a non-throwing closure don't need `try` at all — the throwing-ness is inferred, not blanket-assumed.

## Bad

```swift
// Marked `throws` even though this function has no failure of its own —
// it just happens to call a closure that might throw.
func mapValues<T, U>(_ items: [T], _ transform: (T) throws -> U) throws -> [U] {
    var result: [U] = []
    for item in items {
        result.append(try transform(item))
    }
    return result
}

// Callers with a non-throwing transform are still forced to write `try`
let doubled = try mapValues(numbers) { $0 * 2 }
```

## Good

```swift
func mapValues<T, U>(_ items: [T], _ transform: (T) throws -> U) rethrows -> [U] {
    var result: [U] = []
    for item in items {
        result.append(try transform(item))
    }
    return result
}

// No `try` needed when the closure can't throw
let doubled = mapValues(numbers) { $0 * 2 }

// `try` only required when the closure passed in actually throws
let parsed = try mapValues(strings) { try parseInt($0) }
```

## rethrows Cannot Add Its Own Throw Sites

```swift
// This does NOT compile: rethrows means "only throws because the closure did,"
// so the function body can't introduce an unconditional throw of its own.
//
// func broken<T>(_ items: [T], _ body: (T) throws -> Void) rethrows {
//     if items.isEmpty {
//         throw SomeError.empty   // Error: rethrowing function may not throw unconditionally
//     }
//     for item in items { try body(item) }
// }

// If the function needs its own failure modes too, use plain `throws`
func withOwnFailure<T>(_ items: [T], _ body: (T) throws -> Void) throws {
    guard !items.isEmpty else { throw ValidationError.empty }
    for item in items {
        try body(item)
    }
}
```

Use `rethrows` for generic utilities (`map`, `filter`, `forEach`-style helpers, retry wrappers) whose only source of failure is a closure parameter; switch to `throws` the moment the function itself has an independent failure condition.

## See Also

- [`err-throws-try-propagate`](err-throws-try-propagate.md) - the basic throws/try propagation this specializes
- [`err-typed-throws`](err-typed-throws.md) - typed throws can also be generic over the closure's error type
- [`api-protocol-extension-default`](api-protocol-extension-default.md) - higher-order utilities often live in protocol extensions
