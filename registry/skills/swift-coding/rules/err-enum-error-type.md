# err-enum-error-type

> Define custom `Error` types as enums with associated values

## Why It Matters

An `enum` conforming to `Error` gives you an exhaustive, switchable list of failure modes plus room to attach per-case context (an underlying error, an invalid value, an HTTP status code) via associated values. Using generic `NSError` or stringly-typed errors instead throws away compile-time exhaustiveness checking and forces callers to inspect strings or codes to figure out what went wrong.

## Bad

```swift
func loadUser(id: String) throws -> User {
    if id.isEmpty {
        throw NSError(domain: "UserService", code: 1, userInfo: [
            NSLocalizedDescriptionKey: "id was empty"
        ])
    }
    // ... later
    throw NSError(domain: "UserService", code: 2, userInfo: [
        NSLocalizedDescriptionKey: "user not found"
    ])
}

// Callers must inspect magic codes to distinguish failures
do {
    _ = try loadUser(id: "")
} catch let error as NSError {
    if error.code == 1 { /* ... */ }
}
```

## Good

```swift
enum UserServiceError: Error {
    case invalidID(String)
    case notFound(id: String)
    case network(underlying: Error)
}

func loadUser(id: String) throws -> User {
    guard !id.isEmpty else {
        throw UserServiceError.invalidID(id)
    }
    guard let user = database.find(id) else {
        throw UserServiceError.notFound(id: id)
    }
    return user
}

do {
    _ = try loadUser(id: "")
} catch UserServiceError.invalidID(let id) {
    print("Invalid id: \(id)")
} catch UserServiceError.notFound(let id) {
    print("No user with id: \(id)")
} catch {
    print("Other failure: \(error)")
}
```

## Grouping Related Errors With Nested Enums

```swift
enum AppError: Error {
    case network(NetworkError)
    case validation(ValidationError)
    case unknown(Error)
}

enum NetworkError: Error {
    case timeout
    case unreachable
    case badStatus(Int)
}

enum ValidationError: Error {
    case missingField(String)
    case outOfRange(field: String, value: Int)
}
```

Nesting keeps each error enum small and focused while `AppError` composes them for top-level `catch` handling.

## See Also

- [`err-throws-try-propagate`](err-throws-try-propagate.md) - propagate these errors with throws/try
- [`err-do-catch-specific`](err-do-catch-specific.md) - catch each case explicitly
- [`err-localized-error`](err-localized-error.md) - add user-facing messages to enum errors
- [`type-enum-associated-values`](type-enum-associated-values.md) - the general technique this rule specializes
