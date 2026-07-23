# anti-macro-for-functions

> Don't use function-like macros over templates/inline functions

## Why It Matters

Function-like macros perform blind textual substitution with no type checking, no scoping, and dangerous operator-precedence pitfalls unless every parameter is carefully parenthesized — and even then, an argument with side effects (like `x++`) can be evaluated multiple times unexpectedly. `constexpr`/`inline` functions and templates provide the same (or better) performance with full type safety.

## Bad

```cpp
#define SQUARE(x) x * x

int result = SQUARE(a + b);      // Expands to `a + b * a + b` — WRONG due to precedence!
int result2 = SQUARE(i++);         // Expands to `i++ * i++` — i incremented twice, UB-adjacent
```

## Good

```cpp
template <typename T>
constexpr T square(T x) { return x * x; }

int result = square(a + b);   // Correct: a + b evaluated once, then squared
int result2 = square(i++);      // i incremented exactly once, as expected
```

## See Also

- [tmpl-constexpr-function](tmpl-constexpr-function.md) - `constexpr` functions as the general replacement
- [api-header-only-inline](api-header-only-inline.md) - `inline` for header-defined free functions
- [anti-macro-for-constants](anti-macro-for-constants.md) - The analogous anti-pattern for constants
