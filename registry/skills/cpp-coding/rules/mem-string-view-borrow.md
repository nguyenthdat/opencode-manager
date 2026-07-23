# mem-string-view-borrow

> Use `std::string_view` for read-only string parameters

## Why It Matters

Accepting `const std::string&` forces every caller with a string literal, `char*`, or substring to first materialize a `std::string` (allocating if it doesn't fit small-string optimization). `std::string_view` is a non-owning view that binds to any of these without a copy, while still supporting the full read-only string interface.

## Bad

```cpp
void log(const std::string& message) {
    std::cout << message << "\n";
}

log("literal");            // Implicit std::string construction: allocation (if long)
log(get_c_string());       // Also requires a temporary std::string
```

## Good

```cpp
#include <string_view>

void log(std::string_view message) {
    std::cout << message << "\n";
}

log("literal");           // No allocation: view directly into the literal
log(get_c_string());      // No allocation: view directly into the C string
log(some_std_string);     // No copy: view into the existing string's buffer
```

## `string_view` Does Not Guarantee Null Termination

```cpp
void call_c_api(std::string_view sv) {
    // sv.data() may NOT be null-terminated if it's a substring view!
    // std::printf("%s", sv.data());   // WRONG: may read past the view's end
    std::string owned(sv);             // Materialize when a C API needs a
    std::printf("%s", owned.c_str());  // null-terminated buffer
}
```

## See Also

- [own-span-view](own-span-view.md) - The general non-owning-view principle
- [mem-string-lifetime-c-str](mem-string-lifetime-c-str.md) - Lifetime pitfalls of `c_str()`/`data()`
- [mem-span-bounds](mem-span-bounds.md) - The equivalent for non-string contiguous data
