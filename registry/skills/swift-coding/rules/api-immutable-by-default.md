# api-immutable-by-default

> Default to `let` and immutable structs; opt into `var` deliberately

## Why It Matters

An immutable value can't be mutated out from under a caller, can't be a source of surprising aliasing bugs, and is trivially safe to share across threads without synchronization. Defaulting to `var` "just in case it needs to change later" widens every property's contract to allow mutation whether or not any code path actually depends on it, making it harder to reason about which values are safe to pass around freely.

## Bad

```swift
struct Configuration {
    var apiBaseURL: URL
    var timeout: TimeInterval
    var retryCount: Int
}

func load() -> Configuration {
    var config = Configuration(apiBaseURL: URL(string: "https://api.example.com")!,
                                timeout: 30, retryCount: 3)
    return config   // nothing here ever needed `var`; it's just the reflexive default
}
```

## Good

```swift
struct Configuration {
    let apiBaseURL: URL
    let timeout: TimeInterval
    let retryCount: Int
}

func load() -> Configuration {
    Configuration(apiBaseURL: URL(string: "https://api.example.com")!,
                  timeout: 30, retryCount: 3)
}

// Changes are expressed as a new value, not in-place mutation:
extension Configuration {
    func withTimeout(_ timeout: TimeInterval) -> Configuration {
        Configuration(apiBaseURL: apiBaseURL, timeout: timeout, retryCount: retryCount)
    }
}
```

## When `var` Is the Right Choice

Use `var` for properties whose value genuinely changes over the value's lifetime (a mutable counter, an in-progress form's fields) or for local variables built up incrementally before being frozen into a `let`:

```swift
struct FormState {
    var email: String = ""       // genuinely mutates as the user types
    var isSubmitting: Bool = false
}

func buildGreeting(names: [String]) -> String {
    var result = ""               // local accumulator: `var` is correct here
    for name in names {
        result += "Hello, \(name)! "
    }
    return result
}
```

## See Also

- [`mem-struct-value-semantics`](mem-struct-value-semantics.md) - immutability compounds with value semantics for safety
- [`api-struct-over-class-default`](api-struct-over-class-default.md) - the type-choice half of this default
- [`async-sendable-conformance`](async-sendable-conformance.md) - immutable value types are trivially `Sendable`
