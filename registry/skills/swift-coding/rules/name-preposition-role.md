# name-preposition-role

> Use prepositional argument labels to clarify parameter role

## Why It Matters

When a function has multiple parameters, prepositions like `at`, `from`, `for`, `in`, `with`, and `to` describe how each argument relates to the base name and to the other arguments. Dropping them collapses the call into an ambiguous list of values, forcing readers to open the declaration to understand what each argument means.

## Bad

```swift
extension Array {
    mutating func insert(_ newElement: Element, _ index: Int) { ... }
}
numbers.insert(5, 0) // insert 5 what at index 0? insert 5 into 0?

struct Logger {
    func log(_ message: String, _ level: LogLevel, _ file: String) { ... }
}
logger.log("failed", .error, "Network.swift") // reads as a bare tuple
```

## Good

```swift
extension Array {
    mutating func insert(_ newElement: Element, at index: Int) { ... }
}
numbers.insert(5, at: 0) // clearly: insert 5 at index 0

struct Logger {
    func log(_ message: String, level: LogLevel, in file: String) { ... }
}
logger.log("failed", level: .error, in: "Network.swift")
```

## Common Prepositions and Their Roles

```swift
struct Grid {
    // "at" - a position/index
    subscript(at point: Point) -> Cell { ... }

    // "from"/"to" - source and destination
    func move(from origin: Point, to destination: Point) { ... }

    // "for" - purpose or associated key
    func makeReservation(for user: User, on date: Date) { ... }

    // "with" - an accompanying option or configuration
    func render(with options: RenderOptions) { ... }

    // "in" - containing scope
    func search(_ term: String, in scope: SearchScope) { ... }
}

// Omit the label only when the first argument reads naturally without one,
// per the base name (see name-clarity-call-site).
extension Array {
    func contains(_ element: Element) -> Bool { ... } // not contains(element:)
}
```

## See Also

- [`name-clarity-call-site`](name-clarity-call-site.md) - Clarity at the point of use
- [`api-argument-labels-clarity`](api-argument-labels-clarity.md) - Overall argument label design
- [`name-avoid-abbreviation`](name-avoid-abbreviation.md) - Avoid unclear abbreviations
