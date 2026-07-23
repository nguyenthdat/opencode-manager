# tmpl-concept-standard-library

> Prefer standard concepts over ad hoc traits

## Why It Matters

`<concepts>` provides a well-tested, precisely-specified vocabulary (`std::integral`, `std::floating_point`, `std::invocable`, `std::same_as`, `std::convertible_to`, `std::ranges::range`, and more) covering the vast majority of common constraints. Writing a custom trait or concept for something the standard library already expresses correctly duplicates effort and risks subtly different (often looser) semantics.

## Bad

```cpp
// Hand-rolled "is numeric" check that misses edge cases the standard
// library's std::integral/std::floating_point already handle correctly
// (e.g. cv-qualification, bool as a distinct integral type, char variants).
template <typename T>
constexpr bool is_number_v = std::is_same_v<T, int> || std::is_same_v<T, double>;

template <typename T>
requires (is_number_v<T>)
T square(T x) { return x * x; }

square(3.14f);   // Fails: float wasn't in the hand-rolled list, even though
                  // it's clearly a legitimate numeric type.
```

## Good

```cpp
#include <concepts>

template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template <Numeric T>
T square(T x) { return x * x; }

square(3.14f);   // Works: float satisfies std::floating_point
```

## Common Standard Concepts

```cpp
#include <concepts>
#include <ranges>

template <std::invocable<int> F>          // F can be called with an int argument
void apply(F&& f, int value) { f(value); }

template <std::equality_comparable T>     // T supports == and !=
bool contains(std::span<const T> data, const T& target) {
    return std::ranges::find(data, target) != data.end();
}

template <std::ranges::input_range R>     // R can be iterated with begin()/end()
void print_all(R&& range) {
    for (auto&& v : range) std::cout << v << " ";
}
```

## See Also

- [tmpl-concepts-over-sfinae](tmpl-concepts-over-sfinae.md) - Concepts vs. SFINAE in general
- [tmpl-type-traits-standard](tmpl-type-traits-standard.md) - `<type_traits>` for compile-time queries
- [tmpl-requires-clause](tmpl-requires-clause.md) - Combining standard concepts in `requires` clauses
