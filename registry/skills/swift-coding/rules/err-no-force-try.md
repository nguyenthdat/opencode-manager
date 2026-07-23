# err-no-force-try

> Avoid `try!` outside proven-safe/test contexts

## Why It Matters

`try!` converts any thrown error into an immediate crash, discarding the error's information and any chance of graceful recovery. In application code that runs against real-world input (files, network, user data), the conditions that make a `try!` "safe" today can quietly stop holding after a refactor, turning a recoverable error into a crash with no warning.

## Bad

```swift
func loadBundledConfig() -> Config {
    let url = Bundle.main.url(forResource: "config", withExtension: "json")!
    let data = try! Data(contentsOf: url)
    return try! JSONDecoder().decode(Config.self, from: data)
    // If the config format ever changes without updating this decoder,
    // this crashes on every launch instead of failing gracefully.
}
```

## Good

```swift
enum ConfigError: Error {
    case missingResource
    case decodingFailed(Error)
}

func loadBundledConfig() throws -> Config {
    guard let url = Bundle.main.url(forResource: "config", withExtension: "json") else {
        throw ConfigError.missingResource
    }
    do {
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(Config.self, from: data)
    } catch {
        throw ConfigError.decodingFailed(error)
    }
}

// Caller decides how to degrade
let config = (try? loadBundledConfig()) ?? Config.default
```

## When try! Is Defensible

```swift
// 1. Unit tests — a crash is an acceptable, informative test failure
func testDecoding() {
    let config = try! JSONDecoder().decode(Config.self, from: fixtureData)
    XCTAssertEqual(config.version, 2)
}

// 2. A regular expression or resource compiled from a literal you control,
//    where failure could only mean a build-time typo
static let pattern = try! NSRegularExpression(pattern: #"^\d{3}-\d{4}$"#)

// Prefer wrapping even these in a comment explaining why they're safe,
// so a future edit that changes the literal doesn't silently reintroduce risk.
```

Enable SwiftLint's `force_try` rule for non-test targets to catch regressions automatically.

## See Also

- [`type-no-force-unwrap`](type-no-force-unwrap.md) - the equivalent rule for optionals
- [`err-try-optional-sparingly`](err-try-optional-sparingly.md) - a safer alternative when the reason doesn't matter
- [`anti-force-try-abuse`](anti-force-try-abuse.md) - the broader anti-pattern this rule guards against
