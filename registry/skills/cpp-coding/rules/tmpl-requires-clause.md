# tmpl-requires-clause

> Use `requires` clauses to constrain templates precisely

## Why It Matters

A `requires` clause states exactly which operations/properties a template parameter must support, checked at the template's point of use rather than deep inside its body. This produces immediate, localized error messages instead of failures buried in implementation details, and documents the template's actual contract.

## Bad

```cpp
template <typename Container>
void sort_and_print(Container& c) {
    std::sort(c.begin(), c.end());   // If Container lacks begin()/end()/random
    for (auto& v : c) std::cout << v; // access iterators, the error appears deep
}                                      // inside <algorithm>'s internals, not here.
```

## Good

```cpp
#include <concepts>
#include <ranges>

template <std::ranges::random_access_range Container>
requires std::sortable<std::ranges::iterator_t<Container>>
void sort_and_print(Container& c) {
    std::ranges::sort(c);
    for (auto& v : c) std::cout << v;
}
// Passing a std::list (not random-access) now fails immediately at the call
// site with "constraints not satisfied: random_access_range<std::list<int>>".
```

## Ad Hoc `requires` Expressions

```cpp
template <typename T>
requires requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;   // T supports operator+ returning T-like
    { a < b } -> std::convertible_to<bool>; // T supports operator<
}
T clamp_add(T a, T b, T max) {
    T sum = a + b;
    return sum < max ? sum : max;
}
```

## Combining Multiple Requirements

```cpp
template <typename T>
concept Serializable = requires(const T& t, std::ostream& os) {
    { os << t } -> std::same_as<std::ostream&>;
};

template <Serializable T>
void save(const T& value, std::ostream& out) {
    out << value;
}
```

## See Also

- [tmpl-concepts-over-sfinae](tmpl-concepts-over-sfinae.md) - Named concepts built from `requires` expressions
- [tmpl-concept-standard-library](tmpl-concept-standard-library.md) - Reusing `<concepts>` instead of writing your own
- [tmpl-if-constexpr-branch](tmpl-if-constexpr-branch.md) - Branching on `requires` expressions inline
