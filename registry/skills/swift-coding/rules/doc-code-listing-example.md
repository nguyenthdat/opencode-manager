# doc-code-listing-example

> Include runnable code examples in doc comments

## Why It Matters

A prose description of a function's behavior often leaves the exact call syntax—argument order, labels, error handling—ambiguous, whereas a short code example in the doc comment shows it unambiguously and doubles as a sanity check when read alongside the signature. DocC renders fenced code blocks inside `///` comments as syntax-highlighted listings directly in Quick Help and generated docs.

## Bad

```swift
/// Formats a duration as a human-readable string.
/// Takes seconds and gives you something like a string with hours,
/// minutes, seconds in it depending on the value.
func formatDuration(_ seconds: TimeInterval) -> String {
    ...
}
```

## Good

```swift
/// Formats a duration as a human-readable string.
///
/// ```swift
/// formatDuration(90)     // "1m 30s"
/// formatDuration(3661)   // "1h 1m 1s"
/// formatDuration(45)     // "45s"
/// ```
///
/// - Parameter seconds: The duration to format, in seconds.
/// - Returns: A compact string using the largest applicable units.
func formatDuration(_ seconds: TimeInterval) -> String {
    ...
}
```

## Longer Example with Setup

```swift
/// A thread-safe, in-memory cache with a configurable eviction policy.
///
/// Create a cache, insert values, and retrieve them by key:
///
/// ```swift
/// let cache = Cache<String, Image>(policy: .leastRecentlyUsed(limit: 100))
/// cache.insert(image, forKey: "avatar-42")
///
/// if let cached = cache.value(forKey: "avatar-42") {
///     display(cached)
/// }
/// ```
///
/// Entries beyond the configured limit are evicted automatically
/// according to `policy`.
struct Cache<Key: Hashable, Value> {
    ...
}
```

## See Also

- [`doc-triple-slash-summary`](doc-triple-slash-summary.md) - The summary line preceding examples
- [`doc-docc-articles`](doc-docc-articles.md) - Longer runnable examples in articles/tutorials
- [`doc-public-api-required`](doc-public-api-required.md) - Where examples matter most (public API)
