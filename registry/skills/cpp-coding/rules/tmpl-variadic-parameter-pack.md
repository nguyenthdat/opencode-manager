# tmpl-variadic-parameter-pack

> Use variadic templates and fold expressions

## Why It Matters

Variadic templates accept an arbitrary number of arguments of arbitrary types, checked and expanded at compile time — replacing C-style varargs (`...`, `va_list`), which are untyped, unsafe, and cannot handle non-trivial types correctly. Fold expressions (C++17) collapse a parameter pack into a single expression without manual recursion.

## Bad

```cpp
#include <cstdarg>

// C-style varargs: no type safety, caller must pass a matching format string,
// and passing a non-POD type (like std::string) is undefined behavior.
void log_values(int count, ...) {
    va_list args;
    va_start(args, count);
    for (int i = 0; i < count; ++i) {
        int v = va_arg(args, int);   // WRONG type here silently corrupts memory
        std::cout << v << " ";
    }
    va_end(args);
}
```

## Good

```cpp
template <typename... Args>
void log_values(Args&&... args) {
    ((std::cout << args << " "), ...);   // Fold expression: type-checked at compile time
}

log_values(1, "two", 3.0, std::string("four"));   // Any types, any count, type-safe
```

## Perfect Forwarding With Parameter Packs

```cpp
template <typename T, typename... Args>
std::unique_ptr<T> make(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}
```

## Recursive Processing (When a Fold Isn't Enough)

```cpp
template <typename T>
void print_all(const T& value) {
    std::cout << value << "\n";
}

template <typename T, typename... Rest>
void print_all(const T& value, const Rest&... rest) {
    std::cout << value << ", ";
    print_all(rest...);   // Recurses until the single-argument overload matches
}
```

## See Also

- [tmpl-concepts-over-sfinae](tmpl-concepts-over-sfinae.md) - Constraining pack element types with concepts
- [own-make-unique-shared](own-make-unique-shared.md) - `make_unique`'s use of perfect forwarding shown above
- [tmpl-template-template-param](tmpl-template-template-param.md) - Generic code involving nested template parameters
