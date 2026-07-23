# type-enum-class-over-enum

> Use `enum class` instead of unscoped `enum`

## Why It Matters

An unscoped `enum`'s enumerators leak into the surrounding scope and implicitly convert to `int`, causing name collisions between unrelated enums and allowing nonsensical comparisons/arithmetic across unrelated enum types. `enum class` (C++11) scopes its enumerators and requires explicit conversion, eliminating both problems.

## Bad

```cpp
enum Color { Red, Green, Blue };
enum TrafficLight { Red, Yellow, Green };   // Compile error: Red and Green
                                              // collide with Color's enumerators
                                              // in the same (global) scope

Color c = Red;
if (c == 1) { /* ... */ }   // Compiles: implicit conversion to int, easy to typo a number
```

## Good

```cpp
enum class Color { Red, Green, Blue };
enum class TrafficLight { Red, Yellow, Green };   // No collision: each is scoped

Color c = Color::Red;
// if (c == 1) { }   // Compile error: no implicit conversion to int
if (c == Color::Red) { /* ... */ }   // Must compare against the same enum type
```

## Explicit Conversion When Genuinely Needed

```cpp
enum class Priority : int { Low = 0, Medium = 5, High = 10 };

int as_int = static_cast<int>(Priority::High);   // Explicit, visible conversion
```

## Underlying Type Control

```cpp
enum class StatusCode : uint8_t { Ok, NotFound, ServerError };  // Fixed 1-byte storage
```

## See Also

- [type-variant-over-union](type-variant-over-union.md) - `std::variant` for sum types beyond simple enums
- [api-strong-types-over-bool](api-strong-types-over-bool.md) - `enum class` in place of ambiguous bool parameters
- [type-avoid-c-style-cast](type-avoid-c-style-cast.md) - Named casts for the explicit conversions shown above
