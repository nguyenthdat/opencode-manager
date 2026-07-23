# mem-no-dangling-reference

> Never return references/pointers to locals

## Why It Matters

A reference or pointer to a local variable, or to a temporary, becomes dangling the instant the function returns — the storage is deallocated (or, for a temporary, destroyed at the end of the full expression), but the reference/pointer still looks valid. Reading through it is undefined behavior, often manifesting as silent data corruption rather than a crash.

## Bad

```cpp
const std::string& get_name() {
    std::string name = "temporary";
    return name;   // Dangling: name is destroyed when the function returns
}

int& first_positive(std::vector<int>& values) {
    for (int& v : values) {
        if (v > 0) return v;   // OK if `values` outlives the caller's use
    }
    static int fallback = -1;  // Careful: shared mutable static, not thread-safe
    return fallback;
}

const std::string& get_message() {
    return "temp string built from concatenation: " + suffix;  // Temporary! Dangles.
}
```

## Good

```cpp
std::string get_name() {
    std::string name = "temporary";
    return name;   // Return by value: NRVO or move, no dangling reference
}

std::optional<int> first_positive(const std::vector<int>& values) {
    for (int v : values) {
        if (v > 0) return v;
    }
    return std::nullopt;   // No fallback static needed
}

std::string get_message() {
    return "temp string built from concatenation: " + suffix;  // Return by value
}
```

## Reference Parameters Are Fine — Only Returning Local Data Is the Hazard

```cpp
// Safe: `w` is owned by the caller, which outlives this function call
const std::string& get_widget_name(const Widget& w) {
    return w.name();   // As long as w.name() returns a reference into w itself
}
```

## See Also

- [mem-lifetime-of-callback-captures](mem-lifetime-of-callback-captures.md) - Same hazard in lambda captures
- [own-avoid-get-raw-escape](own-avoid-get-raw-escape.md) - Dangling raw pointers from smart-pointer `.get()`
- [mem-string-lifetime-c-str](mem-string-lifetime-c-str.md) - Dangling `c_str()`/`data()` pointers
