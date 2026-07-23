# doc-doxygen-public-api

> Document all public API with Doxygen comments

## Why It Matters

Doxygen comments render as browsable, searchable documentation (HTML, integrated IDE tooltips) and force the author to articulate a function's purpose, parameters, and return value at the point of writing it — often catching design ambiguities before they become bugs. Undocumented public API leaves every caller to reverse-engineer behavior from the implementation.

## Bad

```cpp
class RateLimiter {
public:
    bool allow(int client_id);   // Allow what? What does the return value mean?
                                    // What happens on invalid client_id?
};
```

## Good

```cpp
/// Tracks and enforces a per-client request rate limit.
class RateLimiter {
public:
    /// Checks whether a request from the given client should be allowed.
    ///
    /// \param client_id Identifier of the requesting client. Must be
    ///        non-negative; behavior is undefined for negative values.
    /// \return `true` if the request is within the client's rate limit and
    ///         should proceed; `false` if it should be rejected.
    bool allow(int client_id);
};
```

## Class-Level and Free-Function Documentation

```cpp
/// Parses a duration string like "5s" or "100ms" into a std::chrono::milliseconds.
///
/// \param text The duration string to parse.
/// \return The parsed duration, or std::nullopt if `text` is malformed.
std::optional<std::chrono::milliseconds> parse_duration(std::string_view text);
```

## See Also

- [doc-brief-detailed-tags](doc-brief-detailed-tags.md) - The specific Doxygen tags to use consistently
- [doc-generated-docs-ci](doc-generated-docs-ci.md) - Building these docs automatically in CI
- [doc-example-usage](doc-example-usage.md) - Adding runnable examples to these comments
