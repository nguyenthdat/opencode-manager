# name-template-param-single-letter

> Single-letter or PascalCase template params

## Why It Matters

Template type parameters follow a distinct, well-established convention (`T`, `U`, `Key`, `Value`, or a descriptive `PascalCase` name) that's immediately recognizable as "this is a placeholder type, not a real class." Using ordinary type-naming conventions for template parameters removes an important visual cue at generic-code call sites and declarations.

## Bad

```cpp
template <typename my_type>       // lower_snake_case: looks like a variable name
class Container {
    my_type value_;
};

template <typename widget>        // Same problem, and shadows any real "widget" type
void process(widget value);
```

## Good

```cpp
template <typename T>              // Single letter: idiomatic for a simple generic type
class Container {
    T value_;
};

template <typename Key, typename Value>   // Descriptive PascalCase when the role
class Map {                                 // of each parameter needs to be named
    // ...
};

template <typename Container, typename Predicate>
auto find_if(const Container& c, Predicate pred);
```

## Non-Type Template Parameters

```cpp
template <size_t N>                // Conventionally uppercase single letter too
class FixedArray {
    std::array<int, N> data_;
};

template <auto Value>              // C++17 auto non-type template parameter
constexpr auto constant = Value;
```

## See Also

- [name-types-pascal](name-types-pascal.md) - Naming for actual (non-template-parameter) types
- [tmpl-concepts-over-sfinae](tmpl-concepts-over-sfinae.md) - Constraining these template parameters
- [tmpl-template-template-param](tmpl-template-template-param.md) - Naming for template template parameters
