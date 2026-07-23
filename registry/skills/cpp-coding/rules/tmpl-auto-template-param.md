# tmpl-auto-template-param

> Use abbreviated function templates for simple generics

## Why It Matters

For simple generic functions, C++20's abbreviated function template syntax (`auto` parameters) reads like a normal function while still being fully generic, avoiding the visual noise of an explicit `template <typename T>` header for trivial cases. Reserve the full `template<...>` form for cases needing multiple related type parameters, explicit specialization, or non-type template parameters.

## Bad (Unnecessarily Verbose for a Simple Case)

```cpp
template <typename T>
auto max_value(const T& a, const T& b) -> const T& {
    return a > b ? a : b;
}
```

## Good — Abbreviated Form (C++20)

```cpp
auto max_value(const auto& a, const auto& b) {
    return a > b ? a : b;
}
```

## Still Use Explicit `template<>` When You Need To Name or Constrain the Type Together

```cpp
// Multiple parameters must be the SAME type — abbreviated syntax can't express
// this (each `auto` parameter is deduced independently):
template <typename T>
T clamp(T value, T low, T high) {
    return value < low ? low : (value > high ? high : value);
}

// Constraining with a concept: still often clearer as an explicit template
// when you also need to name T for a return type or local variable.
template <std::integral T>
T next_power_of_two(T value) {
    T result = 1;
    while (result < value) result <<= 1;
    return result;
}

// Equivalent abbreviated + constrained form, when that's all you need:
auto next_power_of_two(std::integral auto value) {
    decltype(value) result = 1;
    while (result < value) result <<= 1;
    return result;
}
```

## See Also

- [tmpl-concepts-over-sfinae](tmpl-concepts-over-sfinae.md) - Constraining `auto` parameters with concepts
- [type-auto-when-clear](type-auto-when-clear.md) - `auto` for readability more broadly
- [tmpl-requires-clause](tmpl-requires-clause.md) - Adding constraints when a single concept isn't enough
