# err-typed-throws

> Use typed throws (`throws(MyError)`) for precise error contracts

## Why It Matters

Swift 6's typed throws (`func f() throws(MyError) -> T`) lets you declare exactly which error type a function can throw, so callers get a concrete, exhaustively-`switch`able type in `catch` instead of the existential `any Error`. This restores some of the precision `throws` lost by being untyped, without going back to `Result` boilerplate, and it avoids the boxing overhead of an existential error in hot paths.

## Bad

```swift
// Untyped throws: caller only knows "something Error-shaped" was thrown,
// and must downcast to discover which errors are actually possible.
func parse(_ text: String) throws -> Int {
    guard let value = Int(text) else {
        throw ParsingError.invalidFormat(text)
    }
    return value
}

do {
    _ = try parse("abc")
} catch let error as ParsingError {
    handle(error)
} catch {
    // What else could even land here? Not documented anywhere.
    handleUnknown(error)
}
```

## Good

```swift
enum ParsingError: Error {
    case invalidFormat(String)
    case outOfRange(Int)
}

func parse(_ text: String) throws(ParsingError) -> Int {
    guard let value = Int(text) else {
        throw .invalidFormat(text)
    }
    guard value >= 0 else {
        throw .outOfRange(value)
    }
    return value
}

do {
    let value = try parse("abc")
    print(value)
} catch {
    // `error` is statically typed as ParsingError here — exhaustive switch works
    switch error {
    case .invalidFormat(let text):
        print("Bad format: \(text)")
    case .outOfRange(let value):
        print("Out of range: \(value)")
    }
}
```

## Non-Throwing Functions Are throws(Never)

```swift
// Explicitly document that a "throws" function never actually throws,
// useful for generic code that's conditionally throwing.
func alwaysSucceeds() throws(Never) -> Int {
    return 42
}

// Generic functions can be throws(E) where E is a generic parameter,
// letting a higher-order function forward a caller-supplied error type
// precisely instead of boxing into `any Error`.
func run<E: Error>(_ body: () throws(E) -> Void) throws(E) {
    try body()
}
```

Use typed throws for library boundaries and performance-sensitive code where callers benefit from a concrete error type; keep plain `throws` for most application code where the flexibility of mixing several unrelated error types is more valuable than precision.

## See Also

- [`err-enum-error-type`](err-enum-error-type.md) - define the concrete error enum used in the signature
- [`err-throws-try-propagate`](err-throws-try-propagate.md) - the untyped baseline this refines
- [`err-do-catch-specific`](err-do-catch-specific.md) - exhaustive switch over the typed error in catch
