# api-deprecated-attribute

> Use `[[deprecated]]` before removing API

## Why It Matters

Removing a public function outright breaks every caller immediately with a compile error and no warning period. `[[deprecated("reason")]]` gives callers a visible, actionable compiler warning ahead of time, with a message explaining what to migrate to, while the old function still works during the transition period.

## Bad

```cpp
// v1.hpp
std::string format_date(int y, int m, int d);

// v2.hpp — silently removed with no warning; every caller now fails to compile
// with no guidance on what changed or what to use instead.
```

## Good

```cpp
// v1.hpp
[[deprecated("Use format_date(const Date&) instead; will be removed in v3.0")]]
std::string format_date(int y, int m, int d);

std::string format_date(const Date& date);   // New preferred API

format_date(2026, 7, 20);
// warning: 'format_date' is deprecated: Use format_date(const Date&) instead;
// will be removed in v3.0
```

## Deprecating Classes and Members Too

```cpp
class [[deprecated("Use ConnectionPoolV2")]] ConnectionPool { /* ... */ };

class Config {
public:
    [[deprecated("Renamed to get_timeout_ms()")]]
    int get_timeout() const { return get_timeout_ms(); }

    int get_timeout_ms() const;
};
```

## Track Removal in the Codebase

```cpp
// Pair deprecation with a tracked issue/ticket and a target removal version,
// and enable -Wdeprecated-declarations (on by default with most compilers)
// as an error in CI once the migration window has passed, to force cleanup.
```

## See Also

- [api-nodiscard-return](api-nodiscard-return.md) - Another attribute-driven API-evolution tool
- [doc-deprecated-migration](doc-deprecated-migration.md) - Documenting the migration path in detail
- [lint-compiler-warnings-as-errors](lint-compiler-warnings-as-errors.md) - Enforcing these warnings in CI
