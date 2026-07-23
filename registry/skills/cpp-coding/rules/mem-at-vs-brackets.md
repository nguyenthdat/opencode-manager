# mem-at-vs-brackets

> Use `.at()` at boundaries, `operator[]` in verified hot paths

## Why It Matters

`operator[]` on `std::vector`/`std::array`/`std::map` performs no bounds checking in release builds — an out-of-range index is undefined behavior. `.at()` throws `std::out_of_range` instead, converting silent memory corruption into a catchable, debuggable exception. Use `.at()` at API boundaries and with untrusted indices; reserve unchecked `operator[]` for loops where the index range has already been proven safe (and ideally, prefer iterating rather than indexing at all).

## Bad

```cpp
int get_score(const std::vector<int>& scores, size_t index) {
    return scores[index];   // UB if index is out of range — may read garbage, may crash
}

get_score(scores, user_provided_index);  // Untrusted index straight into operator[]
```

## Good

```cpp
int get_score(const std::vector<int>& scores, size_t index) {
    return scores.at(index);   // Throws std::out_of_range: a catchable, clear failure
}

try {
    int s = get_score(scores, user_provided_index);
} catch (const std::out_of_range&) {
    handle_invalid_index();
}
```

## `operator[]` Is Fine Once the Range Is Proven

```cpp
// Loop bound is derived from the same container: index is provably in range
for (size_t i = 0; i < scores.size(); ++i) {
    process(scores[i]);   // Safe: i < scores.size() by loop condition
}

// Even better: avoid indexing entirely
for (int score : scores) {
    process(score);
}
```

## Debug-Hardened Builds Catch This Too

```cpp
// libstdc++/libc++ hardening modes (e.g. _GLIBCXX_ASSERTIONS,
// _LIBCPP_HARDENING_MODE) add bounds checks to operator[] in debug/test
// builds even though the standard doesn't require it. Enable these in CI.
```

## See Also

- [mem-array-over-c-array](mem-array-over-c-array.md) - `std::array`'s `.at()` behaves the same way
- [mem-span-bounds](mem-span-bounds.md) - `std::span` bounds-safety
- [lint-address-sanitizer](lint-address-sanitizer.md) - Catching out-of-bounds access at runtime
