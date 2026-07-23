# tmpl-constexpr-function

> Prefer `constexpr` functions over metaprogramming

## Why It Matters

Classic template metaprogramming (recursive template instantiation to compute values at compile time) is verbose and hard to read. `constexpr` functions let you write ordinary, imperative-looking C++ that the compiler evaluates at compile time when given constant arguments, and falls back to normal runtime execution otherwise — one function, both use cases, ordinary syntax.

## Bad — Classic Template Metaprogramming

```cpp
template <unsigned N>
struct Factorial {
    static constexpr unsigned long long value = N * Factorial<N - 1>::value;
};

template <>
struct Factorial<0> {
    static constexpr unsigned long long value = 1;
};

constexpr auto result = Factorial<10>::value;   // Correct, but unreadable at a glance
```

## Good

```cpp
constexpr unsigned long long factorial(unsigned n) {
    unsigned long long result = 1;
    for (unsigned i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
}

constexpr auto compile_time_result = factorial(10);   // Evaluated at compile time
auto runtime_result = factorial(user_input);           // Same function, evaluated at runtime
```

## `consteval` for Guaranteed Compile-Time Evaluation (C++20)

```cpp
consteval unsigned long long must_be_compile_time(unsigned n) {
    return factorial(n);
}

constexpr auto ok = must_be_compile_time(5);       // OK: compile-time constant argument
// auto bad = must_be_compile_time(user_input);    // Compile error: argument isn't constant
```

## `if consteval` to Branch by Evaluation Context (C++23)

```cpp
constexpr double safe_sqrt(double x) {
    if consteval {
        return compile_time_sqrt_approximation(x);   // Simpler algorithm, compile-time only
    } else {
        return std::sqrt(x);                          // Fast runtime library implementation
    }
}
```

## See Also

- [tmpl-if-constexpr-branch](tmpl-if-constexpr-branch.md) - Compile-time branching within templates
- [tmpl-type-traits-standard](tmpl-type-traits-standard.md) - Compile-time type queries alongside value computation
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Confirming compile-time evaluation is actually beneficial
