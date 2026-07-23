# type-no-force-unwrap

> Avoid `!` force unwrap outside tests/proven invariants

## Why It Matters

Force unwrapping (`!`) turns a `nil` into an immediate, unrecoverable crash with a generic, low-context error message. In production code paths — parsing network responses, user input, file contents — `nil` is often a normal, expected outcome, not a programmer error, so crashing is the wrong response. Prefer explicit handling so failures degrade gracefully instead of taking down the whole app.

## Bad

```swift
func parseAge(from text: String) -> Int {
    // Crashes on any non-numeric input
    return Int(text)!
}

struct APIResponse {
    let json: [String: Any]

    var userID: String {
        json["user_id"] as! String   // Crashes on missing/mistyped key
    }
}
```

## Good

```swift
func parseAge(from text: String) -> Int? {
    return Int(text)
}

struct APIResponse {
    let json: [String: Any]

    var userID: String? {
        json["user_id"] as? String
    }
}

// At the call site, handle the failure explicitly
guard let age = parseAge(from: input) else {
    throw ValidationError.invalidAge(input)
}
```

## When Force Unwrap Is Acceptable

Force unwrap is reasonable only when `nil` is a provable programmer error, not a runtime possibility — and even then, prefer a named invariant over a bare `!`:

```swift
// 1. A literal that is statically known to be valid
let url = URL(string: "https://api.example.com")!

// 2. Immediately after a check that guarantees non-nil
if !array.isEmpty {
    let first = array.first!   // Better: use array.first ?? default instead
}

// 3. Unit tests, where a crash on failure is the desired behavior
func testParsing() {
    let value = parse("42")!
    XCTAssertEqual(value, 42)
}

// Prefer a documented precondition over a bare crash when the invariant
// really is a programmer contract:
func process(_ items: [Item]) {
    precondition(!items.isEmpty, "process(_:) requires at least one item")
    let first = items[0]
}
```

Enable `SwiftLint`'s `force_unwrapping` rule in application code to catch regressions.

## See Also

- [`type-as-safe-cast`](type-as-safe-cast.md) - use as? instead of as!
- [`type-nil-coalescing`](type-nil-coalescing.md) - supply a default instead of crashing
- [`err-precondition-fatal`](err-precondition-fatal.md) - use precondition/fatalError for real programmer errors
- [`anti-force-unwrap-abuse`](anti-force-unwrap-abuse.md) - the broader anti-pattern this rule guards against
