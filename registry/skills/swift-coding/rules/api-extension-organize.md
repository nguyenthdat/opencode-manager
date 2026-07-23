# api-extension-organize

> Use extensions to organize protocol conformances

## Why It Matters

Grouping each protocol conformance into its own `extension` block (rather than mixing every conformance's members into one giant type body) makes the type's file scannable: a reader can see at a glance which members exist to satisfy which protocol, and `// MARK:` comments on each extension turn Xcode's jump bar into a table of contents. It also isolates unrelated changes — adding a new conformance is a self-contained diff instead of an edit scattered through the primary declaration.

## Bad

```swift
struct Invoice {
    let id: String
    let total: Decimal
    let dueDate: Date

    // Equatable, Codable, and CustomStringConvertible members all interleaved
    // with the primary declaration — no visual separation of concerns.
    static func == (lhs: Invoice, rhs: Invoice) -> Bool { lhs.id == rhs.id }

    enum CodingKeys: String, CodingKey { case id, total, dueDate }

    var description: String { "Invoice(\(id))" }
}
```

## Good

```swift
struct Invoice {
    let id: String
    let total: Decimal
    let dueDate: Date
}

// MARK: - Equatable

extension Invoice: Equatable {
    static func == (lhs: Invoice, rhs: Invoice) -> Bool { lhs.id == rhs.id }
}

// MARK: - Codable

extension Invoice: Codable {
    enum CodingKeys: String, CodingKey { case id, total, dueDate }
}

// MARK: - CustomStringConvertible

extension Invoice: CustomStringConvertible {
    var description: String { "Invoice(\(id))" }
}
```

## Splitting Across Files for Large Types

For types with many conformances or a large surface area, take this one step further and give each extension its own file (`Invoice+Codable.swift`, `Invoice+Equatable.swift`), which keeps diffs small and lets multiple contributors touch different conformances without merge conflicts.

## See Also

- [`proj-extension-per-file`](proj-extension-per-file.md) - splitting conformances into separate files
- [`doc-mark-organize`](doc-mark-organize.md) - using `// MARK:` to structure file sections
- [`api-protocol-oriented`](api-protocol-oriented.md) - the protocol-heavy design that produces many conformances to organize
