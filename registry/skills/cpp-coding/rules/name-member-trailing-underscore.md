# name-member-trailing-underscore

> Trailing underscore for private members

## Why It Matters

Distinguishing private data members from local variables and parameters (via a trailing underscore, or alternatively an `m_` prefix — pick one convention project-wide) prevents shadowing confusion in constructors and setters, and lets a reader instantly tell "this identifier refers to object state" without checking the class definition.

## Bad

```cpp
class Widget {
public:
    Widget(int width, int height) {
        width = width;    // Bug: assigns the parameter to itself; member never set!
        height = height;  // Same bug, silently compiles
    }
private:
    int width;
    int height;
};
```

## Good

```cpp
class Widget {
public:
    Widget(int width, int height) : width_(width), height_(height) {}
    // No ambiguity possible: width_ can only refer to the member
private:
    int width_;
    int height_;
};
```

## Applies to Setters Too

```cpp
class Widget {
public:
    void set_width(int width) { width_ = width; }   // Parameter and member are
                                                        // visually distinct at a glance
private:
    int width_ = 0;
};
```

## Pick One Convention and Apply It Project-Wide

```cpp
// Either is acceptable — consistency matters more than which one:
class StyleA { private: int value_; };     // Trailing underscore (Google style)
class StyleB { private: int m_value; };    // m_ prefix (common in game/embedded code)
// Do not mix both conventions within the same codebase.
```

## See Also

- [name-functions-lower-snake](name-functions-lower-snake.md) - The general casing convention this builds on
- [api-default-member-init](api-default-member-init.md) - Default values for these members
- [own-const-correctness-ownership](own-const-correctness-ownership.md) - Distinguishing member access patterns
