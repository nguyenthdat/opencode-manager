# proj-extension-per-file

> Split large types into per-conformance extension files

## Why It Matters

A type with its stored properties, business logic, `Codable` implementation, `Equatable`/`Hashable`, and view-layer conformances all crammed into one file becomes a merge-conflict magnet and forces every reader to scroll past irrelevant conformances to find what they need. Splitting each conformance or major responsibility into its own `TypeName+Conformance.swift` file lets Xcode's jump-to-definition and file navigator do the organizing for you, keeps diffs scoped to the conformance actually being touched, and makes it obvious at a glance which protocols a type participates in.

## Bad

```swift
// User.swift — everything in one 400-line file
struct User {
    let id: UUID
    var name: String
    var email: String
    // ... 30 more properties ...
}

extension User: Codable {
    // 60 lines of custom encode/decode
}

extension User: Equatable {
    static func == (lhs: User, rhs: User) -> Bool { /* ... */ }
}

extension User {
    func validate() -> [ValidationError] { /* ... 80 lines ... */ }
}

extension User: CustomStringConvertible {
    var description: String { /* ... */ }
}
```

## Good

```swift
// User.swift — core definition only
struct User {
    let id: UUID
    var name: String
    var email: String
}
```

```swift
// User+Codable.swift
extension User: Codable {
    // custom encode/decode isolated here
}
```

```swift
// User+Validation.swift
extension User {
    func validate() -> [ValidationError] { /* ... */ }
}
```

```swift
// User+CustomStringConvertible.swift
extension User: CustomStringConvertible {
    var description: String { "\(name) <\(email)>" }
}
```

## When to Keep It in One File

Small types (a handful of properties, one or two trivial conformances like `Equatable` via `synthesized` derivation) don't need splitting — the overhead of extra files outweighs the benefit below roughly 50-80 lines. Reserve per-conformance files for types that have grown large enough that scrolling past conformances is actually a problem, and prefer fixing the underlying "does too much" issue (see `anti-massive-view-controller`) over just relocating the bloat into more files.

```swift
// Fine as a single small file — no need to split
struct Point: Equatable, Codable {
    var x: Double
    var y: Double
}
```

## See Also

- [`proj-feature-folder-organize`](proj-feature-folder-organize.md) - the folder-level analog of this file-level organization
- [`api-extension-organize`](api-extension-organize.md) - the API-design rationale for organizing conformances via extensions
- [`doc-mark-organize`](doc-mark-organize.md) - use `// MARK: -` within a file when splitting into files isn't warranted yet
