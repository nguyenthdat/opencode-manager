# api-protocol-extension-default

> Provide default implementations via protocol extensions

## Why It Matters

Without default implementations, every conforming type must reimplement identical boilerplate for behavior that's really just derived from the protocol's required members, which invites copy-paste drift between conformers. A protocol extension supplies one canonical implementation that every conformer gets for free, while individual types can still override it when they have a genuinely more efficient or different implementation.

## Bad

```swift
protocol Greetable {
    var name: String { get }
    func greeting() -> String
}

struct Person: Greetable {
    let name: String
    func greeting() -> String { "Hello, \(name)!" }   // duplicated per conformer
}

struct Robot: Greetable {
    let name: String
    func greeting() -> String { "Hello, \(name)!" }   // identical, copy-pasted
}
```

## Good

```swift
protocol Greetable {
    var name: String { get }
    func greeting() -> String
}

extension Greetable {
    func greeting() -> String { "Hello, \(name)!" }   // one default for every conformer
}

struct Person: Greetable {
    let name: String
    // gets the default greeting() for free
}

struct Robot: Greetable {
    let name: String
    func greeting() -> String { "BEEP. GREETINGS, \(name.uppercased())." }   // overrides when needed
}
```

## Requirement vs. Extension-Only Members

Only members declared in the protocol itself participate in dynamic dispatch through an `any`/generic value; members added purely in an extension (not declared in the protocol) are statically dispatched and can be silently "hidden" by a more specific static type. Keep anything conformers might reasonably want to override as a protocol requirement with an extension default, and reserve extension-only additions for genuinely fixed, non-overridable helpers:

```swift
protocol Loggable {
    var logTag: String { get }
}

extension Loggable {
    var logTag: String { String(describing: type(of: self)) }   // requirement + default: overridable

    func log(_ message: String) {   // extension-only: fixed helper, not meant to be overridden
        print("[\(logTag)] \(message)")
    }
}
```

## See Also

- [`api-protocol-oriented`](api-protocol-oriented.md) - the broader protocol-first design this supports
- [`api-protocol-associated-type`](api-protocol-associated-type.md) - defaults alongside associated-type requirements
- [`api-composition-over-inheritance`](api-composition-over-inheritance.md) - avoiding base classes for shared behavior
