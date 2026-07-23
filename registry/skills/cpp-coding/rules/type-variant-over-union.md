# type-variant-over-union

> Use `std::variant` instead of raw unions

## Why It Matters

A raw C-style `union` has no built-in tracking of which member is currently active — reading the wrong member is undefined behavior, and the programmer must maintain a separate discriminant field manually. `std::variant<T...>` tracks its active alternative automatically, and `std::visit`/`std::get` enforce type-safe access, turning a manual, error-prone discipline into a compiler-checked one.

## Bad

```cpp
enum class Tag { Int, Float, String };

struct Value {
    Tag tag;
    union {
        int i;
        float f;
        std::string s;   // Non-trivial members in a union require manual
    };                    // constructor/destructor management — easy to get wrong
    // ~Value() must manually check tag and call s.~basic_string() if Tag::String...
};

void print(const Value& v) {
    if (v.tag == Tag::Int) {
        std::cout << v.f;   // Bug: reads the wrong member (f instead of i) — UB,
    }                        // and the discriminant check doesn't prevent this typo
}
```

## Good

```cpp
#include <variant>

using Value = std::variant<int, float, std::string>;

void print(const Value& v) {
    std::visit([](const auto& value) { std::cout << value; }, v);
    // Compiler ensures every alternative is handled and correctly typed;
    // std::get<int>(v) on a variant currently holding float throws std::bad_variant_access
}

Value v = 42;
if (std::holds_alternative<int>(v)) {
    std::cout << std::get<int>(v);
}
```

## Pattern-Matching Style With `std::visit` and Overload Sets

```cpp
template <typename... Ts>
struct Overload : Ts... { using Ts::operator()...; };
template <typename... Ts>
Overload(Ts...) -> Overload<Ts...>;

std::visit(Overload{
    [](int i) { std::cout << "int: " << i; },
    [](float f) { std::cout << "float: " << f; },
    [](const std::string& s) { std::cout << "string: " << s; },
}, v);
```

## See Also

- [type-optional-nullable](type-optional-nullable.md) - `std::optional` for the simpler "one type or nothing" case
- [type-any-for-heterogeneous](type-any-for-heterogeneous.md) - `std::any` for truly unconstrained type erasure
- [err-exceptions-vs-expected](err-exceptions-vs-expected.md) - `std::expected` is itself variant-like for value-or-error
