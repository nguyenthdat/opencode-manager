# tmpl-if-constexpr-branch

> Use `if constexpr` for compile-time branching

## Why It Matters

Before C++17, compile-time branching in templates required tag dispatch or partial specialization — extra overloads and boilerplate just to select code paths based on a compile-time condition. `if constexpr` lets you write the branch inline; the discarded branch isn't even instantiated, so it can contain code that wouldn't compile for the other branch's type.

## Bad

```cpp
// Tag dispatch: two overloads just to branch on a compile-time trait
template <typename T>
std::string to_string_impl(const T& value, std::true_type /* is_arithmetic */) {
    return std::to_string(value);
}

template <typename T>
std::string to_string_impl(const T& value, std::false_type /* is_arithmetic */) {
    return value.to_string();
}

template <typename T>
std::string to_string(const T& value) {
    return to_string_impl(value, std::is_arithmetic<T>{});
}
```

## Good

```cpp
template <typename T>
std::string to_string(const T& value) {
    if constexpr (std::is_arithmetic_v<T>) {
        return std::to_string(value);        // Only instantiated for arithmetic T
    } else {
        return value.to_string();            // Only instantiated for non-arithmetic T
    }
}
```

## Enables Code That Wouldn't Compile Otherwise

```cpp
template <typename Container>
auto first_element(const Container& c) {
    if constexpr (requires { c.front(); }) {
        return c.front();          // Only compiled if Container has front()
    } else {
        return *c.begin();          // Only compiled otherwise — no ambiguous overload needed
    }
}
```

## See Also

- [tmpl-concepts-over-sfinae](tmpl-concepts-over-sfinae.md) - Constraining which types reach this function at all
- [tmpl-constexpr-function](tmpl-constexpr-function.md) - `constexpr` computation more broadly
- [tmpl-requires-clause](tmpl-requires-clause.md) - `requires` expressions used inline as shown above
