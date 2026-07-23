# tmpl-concepts-over-sfinae

> Use C++20 concepts instead of SFINAE

## Why It Matters

SFINAE (`std::enable_if`, `void_t` tricks) constrains templates by exploiting substitution failure, producing cryptic, multi-line error messages when a constraint isn't met and requiring deep template metaprogramming knowledge to write or read. Concepts express the same constraints as readable, named predicates with clear compiler diagnostics pointing at exactly which requirement failed.

## Bad

```cpp
template <typename T, typename = std::enable_if_t<std::is_arithmetic_v<T>>>
T add(T a, T b) {
    return a + b;
}

add(std::string("a"), std::string("b"));
// Error: "candidate template ignored: requirement
//  'std::enable_if_t<std::is_arithmetic_v<std::string>, void>' was not
//  satisfied" — vague and requires knowing what enable_if_t does.
```

## Good

```cpp
#include <concepts>

template <std::integral T>
T add(T a, T b) {
    return a + b;
}

// Or with a named custom concept:
template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template <Numeric T>
T add(T a, T b) { return a + b; }

add(std::string("a"), std::string("b"));
// Error: "constraints not satisfied ... 'Numeric<std::string>' evaluated to
//  false" — directly names the failed concept.
```

## `requires` Clauses for Ad Hoc Constraints

```cpp
template <typename T>
requires requires(T t) { t.serialize(); }   // "T has a serialize() method"
void save(const T& obj) {
    obj.serialize();
}
```

## See Also

- [tmpl-requires-clause](tmpl-requires-clause.md) - `requires` clause syntax in depth
- [tmpl-concept-standard-library](tmpl-concept-standard-library.md) - Preferring standard concepts
- [tmpl-if-constexpr-branch](tmpl-if-constexpr-branch.md) - Compile-time branching alongside concepts
