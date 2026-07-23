# name-type-upper-camel

> Use `UpperCamelCase` for types and protocols

## Why It Matters

Swift distinguishes type-level names from value-level names purely by casing convention, since there is no `type`/`struct` keyword prefix at use sites. Consistent `UpperCamelCase` for `struct`, `class`, `enum`, `protocol`, and `typealias` lets readers instantly tell "this identifier names a type" without looking up its declaration, and it matches every standard library and Apple framework type.

## Bad

```swift
// lowercase or inconsistent casing for types
struct userProfile {
    var name: String
}

class httpClient {
    func fetch() {}
}

enum networkError: Error {
    case timeout
}

protocol dataSource {
    func load() -> [String]
}

typealias completion_handler = (Result<Data, Error>) -> Void
```

## Good

```swift
struct UserProfile {
    var name: String
}

final class HTTPClient {
    func fetch() {}
}

enum NetworkError: Error {
    case timeout
}

protocol DataSource {
    func load() -> [String]
}

typealias CompletionHandler = (Result<Data, Error>) -> Void
```

## Generic Parameters and Nested Types

```swift
// Generic parameter placeholders are also UpperCamelCase (see name-generic-placeholder
// for when to use single letters vs. descriptive names).
struct Stack<Element> {
    private var storage: [Element] = []
}

struct Cache<Key: Hashable, Value> {
    private var storage: [Key: Value] = [:]
}

// Nested types follow the same rule as top-level types.
struct Response {
    struct Metadata {
        var requestID: String
    }
}
```

## See Also

- [`name-func-lower-camel`](name-func-lower-camel.md) - Casing for functions and properties
- [`name-generic-placeholder`](name-generic-placeholder.md) - Naming generic type parameters
- [`name-protocol-capability-suffix`](name-protocol-capability-suffix.md) - Suffixing capability protocols
- [`name-acronym-consistent-case`](name-acronym-consistent-case.md) - Acronym casing in type names
