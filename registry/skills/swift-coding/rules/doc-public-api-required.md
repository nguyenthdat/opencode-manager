# doc-public-api-required

> Document all public API surface

## Why It Matters

Every `public` (or `open`) declaration is a promise to external callers who cannot see its implementation—only its documentation. An undocumented public API forces consumers to read source they may not have access to, or to guess at behavior from the signature alone, which is exactly the friction documentation exists to remove. Internal helpers don't carry the same obligation since their "consumers" can just read the adjacent code.

## Bad

```swift
public struct RetryPolicy {
    public var maxAttempts: Int
    public var backoff: Backoff

    public func shouldRetry(after attempt: Int, error: Error) -> Bool {
        // Public API consumers have no idea what this returns for edge cases
        // (attempt == maxAttempts? negative attempt? non-retryable errors?)
        ...
    }
}
```

## Good

```swift
/// Describes how many times, and with what delay, a failed operation
/// should be retried.
public struct RetryPolicy {
    /// The maximum number of retry attempts before giving up.
    public var maxAttempts: Int

    /// The delay strategy applied between attempts.
    public var backoff: Backoff

    /// Determines whether another attempt should be made.
    ///
    /// - Parameters:
    ///   - attempt: The 1-based number of the attempt that just failed.
    ///   - error: The error the failed attempt produced.
    /// - Returns: `false` once `attempt >= maxAttempts`, or immediately for
    ///   errors that conform to ``NonRetryableError``; `true` otherwise.
    public func shouldRetry(after attempt: Int, error: Error) -> Bool {
        ...
    }
}
```

## Internal Helpers Don't Require the Same Rigor

```swift
// Internal/private helpers can stay lightly documented or undocumented;
// their only "consumers" are engineers who can read the surrounding code.
struct RetryPolicy {
    func exponentialDelay(for attempt: Int) -> TimeInterval {
        pow(2.0, Double(attempt)) * backoff.baseDelay
    }
}

// Enforce this with a lint rule rather than relying on discipline alone:
// SwiftLint's `missing_docs` rule flags public declarations without ///.
```

## See Also

- [`doc-triple-slash-summary`](doc-triple-slash-summary.md) - Summary line format
- [`doc-docc-parameters`](doc-docc-parameters.md) - Parameter documentation
- [`api-access-control-minimal`](api-access-control-minimal.md) - Keeping the public surface small
- [`lint-swiftlint-baseline`](lint-swiftlint-baseline.md) - Enforcing docs via lint rules
