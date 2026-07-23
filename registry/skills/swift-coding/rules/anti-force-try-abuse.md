# anti-force-try-abuse

> Don't force-try in production code

## Why It Matters

`try!` asserts an operation can never throw, but most throwing APIs (`JSONDecoder`, `Data(contentsOf:)`, `NSRegularExpression`) can fail for reasons entirely outside your control — a malformed server response, a missing file, a locale-dependent parse. `try!` converts every one of those into an unconditional crash instead of a recoverable error, and because the failure reason is discarded, the crash log tells you nothing about *why* it failed, only where.

## Bad

```swift
struct ConfigLoader {
    func loadConfig() -> AppConfig {
        let url = Bundle.main.url(forResource: "config", withExtension: "json")!
        let data = try! Data(contentsOf: url)
        return try! JSONDecoder().decode(AppConfig.self, from: data)
        // any malformed config.json (a bad deploy, a merge conflict) crashes at launch
    }
}
```

## Good

```swift
struct ConfigLoader {
    func loadConfig() throws -> AppConfig {
        guard let url = Bundle.main.url(forResource: "config", withExtension: "json") else {
            throw ConfigError.missingResource
        }
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(AppConfig.self, from: data)
    }
}

// Call site decides how to handle failure — fall back, alert, or genuinely crash if truly fatal.
do {
    appConfig = try ConfigLoader().loadConfig()
} catch {
    Logger.app.fault("Failed to load config, using defaults: \(error)")
    appConfig = .default
}
```

## The Narrow Exception

`try!` is reasonable only when failure truly represents a build-time/programmer error that cannot occur given correct code — most commonly, decoding a bundled JSON fixture in a unit test, or compiling a regex from a hardcoded literal pattern known to be valid at compile time. Even then, a comment explaining why the invariant holds keeps the exception auditable:

```swift
// Pattern is a compile-time constant; a failure here means a code bug, not runtime data.
let regex = try! NSRegularExpression(pattern: "^[A-Z]{3}-\\d{4}$")
```

## See Also

- [`err-no-force-try`](err-no-force-try.md) - the positive-form rule this anti-pattern violates
- [`lint-force-unwrap-rule`](lint-force-unwrap-rule.md) - enforce this via SwiftLint's `force_try` rule
- [`anti-force-unwrap-abuse`](anti-force-unwrap-abuse.md) - the force-unwrap sibling of this anti-pattern
- [`err-precondition-fatal`](err-precondition-fatal.md) - the correct tool for genuine programmer-error assertions
