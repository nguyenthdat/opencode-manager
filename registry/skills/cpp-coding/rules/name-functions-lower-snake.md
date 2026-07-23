# name-functions-lower-snake

> `lower_snake_case` for functions, methods, variables

## Why It Matters

Consistently lowercase, underscore-separated names for functions and variables (matching the C++ standard library's own convention) make code visually distinct from `PascalCase` type names, and align with the majority of modern C++ style guides (Google, LLVM-adjacent projects, and the standard library itself).

## Bad

```cpp
class Widget {
public:
    void RenderFrame();      // PascalCase for a method — collides visually with type names
    int GetWidth() const;
private:
    int m_Width;              // Hungarian-ish prefix mixed with PascalCase
};

void ProcessAllItems(std::vector<int> ItemList);
```

## Good

```cpp
class Widget {
public:
    void render_frame();
    int width() const;       // No get_ prefix needed for a simple accessor either
private:
    int width_ = 0;
};

void process_all_items(std::vector<int> item_list);
```

## Consistency Across an Overload Set

```cpp
class Logger {
public:
    void log(std::string_view message);
    void log(LogLevel level, std::string_view message);
    // Both overloads follow the same casing and naming convention
};
```

## See Also

- [name-types-pascal](name-types-pascal.md) - The complementary type-naming convention
- [name-member-trailing-underscore](name-member-trailing-underscore.md) - Private member naming shown above
- [name-boolean-is-has](name-boolean-is-has.md) - Boolean-specific naming prefixes
