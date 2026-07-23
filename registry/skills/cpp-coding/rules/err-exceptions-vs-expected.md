# err-exceptions-vs-expected

> Choose exceptions vs `std::expected`/error codes deliberately

## Why It Matters

Exceptions and `std::expected<T, E>` solve the same problem — reporting failure — with different trade-offs. Exceptions are best for truly exceptional, rare conditions where propagating through many call layers unchanged is desirable. `std::expected`/error codes are better for expected, frequent failure modes on hot paths, where the cost of stack unwinding matters or the caller is expected to branch on the specific error immediately.

## Bad

```cpp
// Using exceptions for routine, expected failures — parsing user input fails
// constantly and isn't exceptional, but every caller now pays exception
// overhead and must structure control flow around try/catch for a normal case.
int parse_port(const std::string& text) {
    return std::stoi(text);   // Throws std::invalid_argument on ordinary bad input
}

for (const auto& line : config_lines) {
    try {
        ports.push_back(parse_port(line));   // Exceptions used for routine validation
    } catch (...) {
        // ...
    }
}
```

## Good

```cpp
#include <expected>
#include <charconv>

std::expected<int, std::string> parse_port(std::string_view text) {
    int value{};
    auto [ptr, ec] = std::from_chars(text.data(), text.data() + text.size(), value);
    if (ec != std::errc{} || ptr != text.data() + text.size()) {
        return std::unexpected("invalid port: " + std::string(text));
    }
    return value;
}

for (const auto& line : config_lines) {
    if (auto port = parse_port(line)) {
        ports.push_back(*port);
    } else {
        log_warning(port.error());
    }
}
```

## Decision Guide

| Situation | Prefer |
|---|---|
| Truly rare/unexpected (OOM, corrupted invariant) | Exception |
| Expected, frequent (parse failure, not-found lookup) | `std::expected`/`std::optional` |
| Hot-path validation, called in a tight loop | `std::expected`/error code (no unwind cost) |
| Crossing a C ABI boundary | Error code (exceptions cannot cross) |
| Library used by callers who need to `catch` broad categories | Exception hierarchy |

## See Also

- [err-expected-for-recoverable](err-expected-for-recoverable.md) - `std::expected` usage in depth
- [err-custom-exception-hierarchy](err-custom-exception-hierarchy.md) - Exception hierarchy design
- [err-no-exceptions-across-abi](err-no-exceptions-across-abi.md) - Why exceptions can't cross `extern "C"`
