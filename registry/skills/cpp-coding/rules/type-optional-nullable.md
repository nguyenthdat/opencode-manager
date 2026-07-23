# type-optional-nullable

> Use `std::optional<T>` instead of sentinel values

## Why It Matters

Sentinel values (`-1` for "not found," a null pointer meaning "no data," an empty string meaning "unset") overload a valid value's type to also mean "absent," which is easy to misuse (what if `-1` is itself a legitimate value?) and easy to forget to check. `std::optional<T>` makes "may be absent" part of the type itself, and the compiler forces an explicit check before access.

## Bad

```cpp
int find_index(const std::vector<int>& v, int target) {
    for (size_t i = 0; i < v.size(); ++i) {
        if (v[i] == target) return static_cast<int>(i);
    }
    return -1;   // Sentinel: but what if -1 could also be a genuine "index" value
                  // in some future context, or the caller simply forgets to check?
}

int idx = find_index(values, 42);
process(values[idx]);   // If idx is -1, this is a silent out-of-bounds access
```

## Good

```cpp
#include <optional>

std::optional<size_t> find_index(const std::vector<int>& v, int target) {
    for (size_t i = 0; i < v.size(); ++i) {
        if (v[i] == target) return i;
    }
    return std::nullopt;
}

if (auto idx = find_index(values, 42)) {
    process(values[*idx]);   // Only reached if a real index was found
} else {
    handle_not_found();
}
```

## `optional` Composition

```cpp
std::optional<Config> load_config(const std::string& path);

// value_or provides a fallback without an explicit if/else
Config cfg = load_config(path).value_or(Config::default_config());

// and_then/transform chain optional-returning operations (C++23 or a library)
std::optional<int> port = load_config(path)
    .and_then([](const Config& c) { return c.get_port(); });
```

## See Also

- [err-optional-for-absence](err-optional-for-absence.md) - When `optional` is the right tool vs. `expected`
- [own-observer-ptr-reference](own-observer-ptr-reference.md) - Avoiding raw-pointer sentinels for "maybe absent"
- [type-variant-over-union](type-variant-over-union.md) - `std::variant` for multi-way sum types
