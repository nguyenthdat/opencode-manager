# tmpl-type-traits-standard

> Use `<type_traits>` instead of hand-rolled checks

## Why It Matters

`<type_traits>` provides compile-time predicates and transformations (`std::is_same`, `std::is_base_of`, `std::remove_reference`, `std::decay`, `std::conditional`) that are precisely specified and handle edge cases (cv-qualification, references, arrays) that a hand-written equivalent easily misses.

## Bad

```cpp
// Hand-rolled "same type" check that doesn't account for cv-qualifiers
// or reference-ness the way the caller might expect
template <typename A, typename B>
constexpr bool same_type() { return false; }

template <typename A>
constexpr bool same_type<A, A>() { return true; }  // Doesn't even compile as written —
                                                     // partial specialization of function
                                                     // templates isn't legal C++
```

## Good

```cpp
#include <type_traits>

template <typename A, typename B>
constexpr bool same = std::is_same_v<A, B>;

static_assert(same<int, int>);
static_assert(!same<int, const int>);   // Correctly distinguishes cv-qualification

template <typename T>
using CleanType = std::remove_cvref_t<T>;   // Strips const/volatile/reference (C++20)

template <typename T>
void store(T&& value) {
    using Stored = std::decay_t<T>;   // Value semantics: arrays decay to pointers,
    Stored copy = std::forward<T>(value);   // functions decay to pointers, refs stripped
    container_.push_back(std::move(copy));
}
```

## Compile-Time Conditional Types

```cpp
template <bool UseDouble>
using NumberType = std::conditional_t<UseDouble, double, int>;

template <typename T>
struct Wrapper {
    // Choose storage type at compile time depending on T's properties
    using StorageType = std::conditional_t<std::is_trivially_copyable_v<T>, T, std::unique_ptr<T>>;
};
```

## See Also

- [tmpl-concept-standard-library](tmpl-concept-standard-library.md) - Concepts built atop these same traits
- [tmpl-if-constexpr-branch](tmpl-if-constexpr-branch.md) - Branching on trait results at compile time
- [type-narrowing-conversion-explicit](type-narrowing-conversion-explicit.md) - Using traits to guard numeric conversions
