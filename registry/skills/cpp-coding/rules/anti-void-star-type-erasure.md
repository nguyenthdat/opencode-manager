# anti-void-star-type-erasure

> Don't use `void*` when templates/`variant`/`any` exist

## Why It Matters

A `void*` used to pass "any type" of data provides zero type safety — the compiler cannot verify that the code casting it back matches the type that was originally stored, and a mismatch is silent undefined behavior rather than a compile error or a checked runtime exception.

## Bad

```cpp
void register_callback(void (*fn)(void*), void* user_data);

int value = 42;
register_callback([](void* data) {
    double* d = static_cast<double*>(data);   // WRONG type! `data` actually
    use(*d);                                    // points to an int — silent UB
}, &value);
```

## Good — Templates for Compile-Time Type Safety

```cpp
template <typename T, typename F>
void register_callback(F fn, T user_data) {
    fn(user_data);   // Type-checked at compile time; no cast, no mismatch possible
}
```

## Good — `std::any` for Genuine Runtime Type Erasure

```cpp
void register_callback(std::function<void(std::any)> fn, std::any user_data);

register_callback([](std::any data) {
    if (auto* d = std::any_cast<double>(&data)) {
        use(*d);
    }   // Mismatch is a checked nullptr, not silent UB
}, 42);   // Passing an int where double was expected is now safely detected
```

## See Also

- [type-any-for-heterogeneous](type-any-for-heterogeneous.md) - Appropriate, narrow uses of `std::any`
- [type-variant-over-union](type-variant-over-union.md) - `std::variant` when the type set is known in advance
- [tmpl-concepts-over-sfinae](tmpl-concepts-over-sfinae.md) - Compile-time genericity as the preferred alternative
