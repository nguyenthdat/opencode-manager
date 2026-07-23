# api-rule-of-zero-value-types

> Value types: rule of zero

## Why It Matters

Public value types (data-carrying structs/classes with no polymorphic behavior) should compose entirely from members that already manage their own resources correctly, so the compiler-generated special members are correct by construction. This keeps the public API's behavioral contract simple: copies are deep and correct, moves are cheap, and there's no hand-written code to audit for bugs.

## Bad

```cpp
class Point3D {
public:
    Point3D(double x, double y, double z) : x_(x), y_(y), z_(z) {}
    // Unnecessary: hand-written copy/move for a type with only doubles
    Point3D(const Point3D& other) = default;
    Point3D(Point3D&& other) noexcept = default;
    Point3D& operator=(const Point3D& other) = default;
    Point3D& operator=(Point3D&& other) noexcept = default;
    ~Point3D() = default;
private:
    double x_, y_, z_;
};
```

## Good

```cpp
class Point3D {
public:
    Point3D(double x, double y, double z) : x_(x), y_(y), z_(z) {}
    // No special members declared at all — compiler generates correct ones
private:
    double x_, y_, z_;
};

struct UserProfile {
    std::string name;
    std::optional<std::string> bio;
    std::vector<std::string> tags;
    // Rule of Zero applies here too: every member manages its own resources
};
```

## See Also

- [raii-rule-of-zero](raii-rule-of-zero.md) - The underlying RAII rule
- [api-default-member-init](api-default-member-init.md) - Complementary default-initialization guidance
- [type-structured-bindings](type-structured-bindings.md) - Consuming these value types ergonomically
