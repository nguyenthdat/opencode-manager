# doc-link-symbols

> Cross-link related symbols with DocC double-backtick links

## Why It Matters

Plain text mentions of a related type or method (`` "see the `Config` type" ``) are dead ends in generated documentation—the reader has to manually search for it. DocC's double-backtick syntax (`` ``TypeName`` `` or `` ``TypeName/method(_:)`` ``) turns those mentions into clickable links that resolve at doc-build time, and Xcode/DocC will warn if the linked symbol doesn't exist, catching stale references.

## Bad

```swift
/// Loads the app configuration. See the Config type for the fields it
/// produces, and see also the validate method on it before using the
/// result.
func loadConfig() throws -> Config {
    ...
}
```

## Good

```swift
/// Loads the app configuration.
///
/// The returned ``Config`` should be passed to ``Config/validate()``
/// before use, since this function does not validate the values itself.
func loadConfig() throws -> Config {
    ...
}
```

## Linking Members, Overloads, and Other Modules

```swift
/// A validated, immutable snapshot of the app's configuration.
///
/// Create instances via ``ConfigLoader/loadConfig()``, not directly,
/// so that ``validate()`` has already been run.
struct Config {
    var maxRetries: Int
    var timeout: TimeInterval

    /// Checks that all fields hold acceptable values.
    ///
    /// - Throws: ``ConfigError/invalidTimeout`` if ``timeout`` is negative.
    func validate() throws {
        ...
    }
}

// Disambiguating an overloaded method requires its full signature:
// ``Cache/insert(_:forKey:)`` vs ``Cache/insert(contentsOf:)``

// Linking to a symbol in another module (must be imported/linkable):
/// Wraps errors surfaced by ``Foundation/URLSession``.
enum NetworkError: Error {
    case transportFailure(underlying: Error)
}
```

## See Also

- [`doc-docc-articles`](doc-docc-articles.md) - Linking symbols from conceptual articles
- [`doc-triple-slash-summary`](doc-triple-slash-summary.md) - Where these links typically appear
- [`doc-public-api-required`](doc-public-api-required.md) - Public API documentation obligations
