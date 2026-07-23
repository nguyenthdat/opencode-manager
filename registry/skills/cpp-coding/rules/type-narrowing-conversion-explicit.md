# type-narrowing-conversion-explicit

> Make narrowing conversions explicit and checked

## Why It Matters

A narrowing conversion (`long` to `int`, `double` to `float`, unsigned to signed) can silently lose data or produce implementation-defined/undefined results with no compiler warning in ordinary assignment or function-call contexts. Making the conversion explicit — and checked, where correctness depends on the value actually fitting — prevents silent data corruption.

## Bad

```cpp
void set_count(int count);

long big_count = 3'000'000'000;   // Exceeds INT_MAX on most platforms
set_count(big_count);              // Silent narrowing: implementation-defined result,
                                     // no warning by default with a plain function call

double ratio = 1.0 / 3.0;
float f = ratio;   // Silent precision loss, no warning
```

## Good — Brace Initialization Catches It at Compile Time

```cpp
int count{big_count};   // Compile ERROR: narrowing conversion in a braced-init-list
                          // (this is exactly the scenario braces are designed to catch)
```

## Good — Explicit, Checked Conversion When Narrowing Is Intentional

```cpp
#include <stdexcept>

int checked_narrow(long value) {
    if (value < std::numeric_limits<int>::min() || value > std::numeric_limits<int>::max()) {
        throw std::overflow_error("value does not fit in int");
    }
    return static_cast<int>(value);
}

set_count(checked_narrow(big_count));   // Fails loudly instead of corrupting silently
```

## GSL's `narrow`/`narrow_cast` (Core Guidelines Support Library)

```cpp
#include <gsl/gsl>

int count = gsl::narrow<int>(big_count);   // Throws gsl::narrowing_error if it doesn't fit
int count2 = gsl::narrow_cast<int>(big_count);  // Explicit, but unchecked — documents intent only
```

## See Also

- [type-avoid-c-style-cast](type-avoid-c-style-cast.md) - Named casts for conversions in general
- [lint-compiler-warnings-as-errors](lint-compiler-warnings-as-errors.md) - `-Wconversion`/`-Wsign-conversion` catch many of these
- [tmpl-type-traits-standard](tmpl-type-traits-standard.md) - Compile-time bounds checks via `<type_traits>`/`<limits>`
