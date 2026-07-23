# name-boolean-assertive

> Name Booleans and predicates assertively (`isEmpty`, `hasSuffix`)

## Why It Matters

A Boolean property or function reads best as an assertion about the receiver—"it is empty," "it has a suffix"—so at the call site `if user.isActive` reads like English. Names without an assertive prefix (`active`, `suffix`, `enabled`) are ambiguous: is `suffix` a Boolean or a `String`? Consistent `is`/`has`/`should`/`can` prefixes remove that ambiguity instantly.

## Bad

```swift
struct User {
    var active: Bool
    var admin: Bool
    var deleted: Bool
}

extension String {
    func suffix(_ s: String) -> Bool { hasSuffix: self.hasSuffix(s) } // shadow confusion
    func empty() -> Bool { self.isEmpty }
}

func validate(form: Form) -> Bool { ... }
if validate(form: signupForm) { submit() } // reads oddly as a standalone call
```

## Good

```swift
struct User {
    var isActive: Bool
    var isAdmin: Bool
    var isDeleted: Bool
}

extension String {
    func hasSuffix(_ suffix: String) -> Bool { ... } // stdlib convention
    var isEmpty: Bool { ... }
}

func isValid(_ form: Form) -> Bool { ... }
if isValid(signupForm) { submit() }
```

## Other Assertive Prefixes

```swift
struct Task {
    var isComplete: Bool
    var hasDependencies: Bool
    var shouldRetryOnFailure: Bool
    var canBeCancelled: Bool
}

protocol Cancellable {
    var isCancelled: Bool { get }
}

// Negative-sounding names read poorly when negated; avoid `isNotReady`.
// Prefer the positive form and let call sites negate with `!`.
struct Connection {
    var isReady: Bool // not `isNotReady`
}
if !connection.isReady { ... }
```

## See Also

- [`name-clarity-call-site`](name-clarity-call-site.md) - Clarity at the point of use
- [`name-func-lower-camel`](name-func-lower-camel.md) - Casing convention for properties
- [`name-mutating-ed-pairs`](name-mutating-ed-pairs.md) - Verb/adjective naming pairs
