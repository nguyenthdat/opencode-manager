# err-expected-for-recoverable

> Use `std::expected<T,E>` for recoverable failures

## Why It Matters

`std::expected<T, E>` (C++23) represents "either a value or an error" without exceptions: no stack unwinding cost, the error type is precise and checked by the compiler, and `[[nodiscard]]`-style call sites force the caller to handle the failure. It's the modern alternative to output-parameter error codes and to using exceptions for routine, expected failures.

## Bad

```cpp
// Error code via output parameter: easy to ignore, easy to forget to check
bool parse_config(const std::string& text, Config& out, std::string& error) {
    if (text.empty()) {
        error = "empty config";
        return false;
    }
    out = do_parse(text);
    return true;
}

Config cfg;
std::string err;
parse_config(text, cfg, err);   // Return value ignored — silent failure
use(cfg);                        // Uses a default-constructed, invalid Config
```

## Good

```cpp
#include <expected>

std::expected<Config, std::string> parse_config(std::string_view text) {
    if (text.empty()) {
        return std::unexpected("empty config");
    }
    return do_parse(text);
}

auto result = parse_config(text);
if (!result) {
    log_error(result.error());
    return;
}
use(*result);   // result.value() also works
```

## Chaining With Monadic Operations (C++23)

```cpp
std::expected<int, std::string> parse_and_double(std::string_view text) {
    return parse_config(text)
        .transform([](const Config& c) { return c.value; })
        .transform([](int v) { return v * 2; });
}
```

## Without C++23: A Library Equivalent

```cpp
// tl::expected (https://github.com/TartanLlama/expected) provides the same
// API and predates the standard version — use it if the project targets
// C++17/20 but wants expected-style error handling now.
```

## See Also

- [err-exceptions-vs-expected](err-exceptions-vs-expected.md) - When to choose `expected` over exceptions
- [err-nodiscard-fallible](err-nodiscard-fallible.md) - Forcing callers to check the result
- [type-optional-nullable](type-optional-nullable.md) - `std::optional` for absence without an error reason
