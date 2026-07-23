# perf-string-concatenation

> Avoid repeated string concatenation

## Why It Matters

Each `operator+`/`+=` on a `std::string` may reallocate if the result exceeds current capacity, and each `+` between two strings can create a temporary intermediate result. Building a string via many small concatenations in a loop can trigger repeated reallocation; reserving capacity up front, or using a dedicated stream/formatting facility, avoids this.

## Bad

```cpp
std::string build_report(const std::vector<std::string>& lines) {
    std::string report;
    for (const auto& line : lines) {
        report = report + line + "\n";   // Creates TWO temporary strings per
    }                                       // iteration, plus potential reallocation
    return report;
}
```

## Good

```cpp
std::string build_report(const std::vector<std::string>& lines) {
    std::string report;
    size_t total_size = 0;
    for (const auto& line : lines) total_size += line.size() + 1;
    report.reserve(total_size);       // Pre-size to avoid reallocation

    for (const auto& line : lines) {
        report += line;                 // += avoids the extra temporary that + creates
        report += '\n';
    }
    return report;
}
```

## `std::format` (C++20) for Readable, Efficient Formatting

```cpp
#include <format>

std::string message = std::format("{} connected from {}:{}", username, ip, port);
// Type-safe, no manual concatenation, and typically implemented efficiently
// under the hood (single allocation for the result in common cases).
```

## `ostringstream` for Complex, Mixed-Type Building

```cpp
#include <sstream>

std::ostringstream oss;
oss << "User " << user_id << " performed " << action << " at " << timestamp;
std::string result = oss.str();
```

## See Also

- [perf-avoid-unneeded-allocation](perf-avoid-unneeded-allocation.md) - The general allocation-avoidance principle
- [mem-string-view-borrow](mem-string-view-borrow.md) - Avoiding string copies for read-only access
- [perf-reserve-known-size](perf-reserve-known-size.md) - `reserve()` for strings, same principle as for vectors
