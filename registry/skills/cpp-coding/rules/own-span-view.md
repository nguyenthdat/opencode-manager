# own-span-view

> Use `std::span`/`string_view` for non-owning views

## Why It Matters

Passing `const std::vector<T>&` or `const std::string&` unnecessarily constrains callers to those specific container types and forces allocation when they hold data differently (a C array, a substring, a `std::array`). `std::span<T>` (C++20) and `std::string_view` (C++17) are lightweight, non-owning views that work across all contiguous storage without copying.

## Bad

```cpp
// Forces callers to have a std::vector, even if they have a std::array or C array
double sum(const std::vector<double>& values) {
    double total = 0;
    for (double v : values) total += v;
    return total;
}

double arr[] = {1.0, 2.0, 3.0};
// Doesn't compile without an unwanted copy into a vector:
// sum(arr);
```

## Good

```cpp
#include <span>

double sum(std::span<const double> values) {
    double total = 0;
    for (double v : values) total += v;
    return total;
}

double arr[] = {1.0, 2.0, 3.0};
std::vector<double> vec = {4.0, 5.0};
std::array<double, 2> stdarr = {6.0, 7.0};

sum(arr);      // Works: array
sum(vec);      // Works: vector
sum(stdarr);   // Works: std::array
```

## `string_view` for Strings

```cpp
#include <string_view>

bool starts_with(std::string_view text, std::string_view prefix) {
    return text.substr(0, prefix.size()) == prefix;
}

starts_with("hello world", "hello");      // string literal, no allocation
starts_with(std::string("hello"), "he");  // std::string, no copy
```

## Caution: Views Don't Extend Lifetime

```cpp
std::string_view dangling() {
    std::string local = "temporary";
    return local;   // Dangling: local is destroyed, view points at freed memory
}
```

## See Also

- [mem-span-bounds](mem-span-bounds.md) - `span` for bounds-safety specifically
- [mem-string-view-borrow](mem-string-view-borrow.md) - `string_view` parameter guidance in depth
- [mem-lifetime-of-callback-captures](mem-lifetime-of-callback-captures.md) - Lifetime pitfalls with views
