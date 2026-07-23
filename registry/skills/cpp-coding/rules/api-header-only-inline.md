# api-header-only-inline

> Mark header-only free functions `inline`

## Why It Matters

A non-template, non-member function defined (not just declared) directly in a header is included, and thus defined, in every translation unit that includes that header — without `inline`, this violates the One Definition Rule (ODR) and causes a linker error ("multiple definition of...") as soon as more than one `.cpp` file includes the header.

## Bad

```cpp
// utils.hpp
double to_celsius(double fahrenheit) {   // Defined, not just declared, in a header
    return (fahrenheit - 32.0) * 5.0 / 9.0;
}

// a.cpp and b.cpp both #include "utils.hpp"
// Linker error: multiple definition of `to_celsius`
```

## Good

```cpp
// utils.hpp
inline double to_celsius(double fahrenheit) {
    return (fahrenheit - 32.0) * 5.0 / 9.0;
}
```

## Class Member Functions Defined In-Class Are Implicitly `inline`

```cpp
class Thermometer {
public:
    double to_celsius(double fahrenheit) const {   // Implicitly inline: defined
        return (fahrenheit - 32.0) * 5.0 / 9.0;      // inside the class body
    }
};

// But an out-of-class member function definition in a header needs it explicitly:
class Thermometer2 {
public:
    double to_celsius(double fahrenheit) const;
};

inline double Thermometer2::to_celsius(double fahrenheit) const {
    return (fahrenheit - 32.0) * 5.0 / 9.0;
}
```

## `constexpr` Functions Are Also Implicitly `inline`

```cpp
constexpr double square(double x) { return x * x; }   // No separate `inline` needed
```

## See Also

- [proj-header-source-split](proj-header-source-split.md) - When to move definitions to a `.cpp` file instead
- [tmpl-avoid-bloat](tmpl-avoid-bloat.md) - Related header-inclusion cost concerns for templates
- [proj-include-guards-pragma-once](proj-include-guards-pragma-once.md) - Preventing duplicate inclusion within one TU
