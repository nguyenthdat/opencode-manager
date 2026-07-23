# doc-docc-throws

> Document thrown errors with `- Throws`

## Why It Matters

A `throws` function signature tells a caller *that* it can throw, but not *which* errors or under what conditions—information a caller needs to write a meaningful `catch`. The `- Throws:` DocC field documents the specific error type(s) and the circumstances that trigger them, turning a guessing game into a documented contract.

## Bad

```swift
/// Parses a configuration file.
func parseConfig(at path: String) throws -> Config {
    // Callers have no idea which errors are possible without reading the body.
    ...
}
```

## Good

```swift
/// Parses a configuration file at the given path.
///
/// - Parameter path: The filesystem path to the configuration file.
/// - Returns: The parsed ``Config``.
/// - Throws: ``ConfigError/fileNotFound`` if no file exists at `path`,
///   ``ConfigError/invalidFormat(_:)`` if the file's contents cannot be
///   parsed as valid TOML, or an underlying `CocoaError` if the file
///   cannot be read due to permissions.
func parseConfig(at path: String) throws -> Config {
    ...
}
```

## Multiple Throwing Call Sites in One Function

```swift
enum ConfigError: Error {
    case fileNotFound
    case invalidFormat(line: Int)
}

/// Loads and validates the application configuration.
///
/// - Throws: ``ConfigError/fileNotFound`` if the config file is missing,
///   ``ConfigError/invalidFormat(line:)`` if a specific line fails to parse,
///   or ``ValidationError`` if the parsed config fails semantic validation
///   (e.g. a negative timeout value).
func loadAndValidateConfig(at path: String) throws -> Config {
    let raw = try readFile(at: path)          // throws ConfigError.fileNotFound
    let config = try parse(raw)                // throws ConfigError.invalidFormat
    try validate(config)                       // throws ValidationError
    return config
}
```

## See Also

- [`doc-docc-returns`](doc-docc-returns.md) - Documenting return values
- [`err-enum-error-type`](err-enum-error-type.md) - Modeling errors as enums to document precisely
- [`err-localized-error`](err-localized-error.md) - User-facing error descriptions
