# tmpl-crtp-static-polymorphism

> Use CRTP for static polymorphism when virtual dispatch cost matters

## Why It Matters

The Curiously Recurring Template Pattern (CRTP) lets a base class call methods on its derived class without virtual dispatch: the base is templated on the derived type, so calls are resolved and often inlined at compile time. This gives polymorphism-like code reuse with zero vtable/indirect-call overhead, at the cost of losing runtime polymorphism (you can't store a heterogeneous collection of CRTP types through a common base pointer).

## Bad

```cpp
// Runtime virtual dispatch just to reuse shape logic — costs a vtable lookup
// per call, and prevents inlining in a hot rendering loop.
class Shape {
public:
    virtual double area() const = 0;
    virtual ~Shape() = default;
};

class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return 3.14159 * r_ * r_; }
private:
    double r_;
};
```

## Good — CRTP for a Hot-Path Interface

```cpp
template <typename Derived>
class ShapeBase {
public:
    double area() const {
        return static_cast<const Derived*>(this)->area_impl();   // No vtable lookup
    }
};

class Circle : public ShapeBase<Circle> {
public:
    explicit Circle(double r) : r_(r) {}
    double area_impl() const { return 3.14159 * r_ * r_; }
private:
    double r_;
};

template <typename Derived>
double total_area(const std::vector<Derived>& shapes) {
    double total = 0;
    for (const auto& s : shapes) total += s.area();   // Can be fully inlined
    return total;
}
```

## When Runtime Polymorphism Is Actually Needed

```cpp
// If you need a std::vector<std::unique_ptr<Shape>> holding mixed shape
// types, CRTP can't provide that — use virtual dispatch (the classic Shape
// base above) instead. Don't apply CRTP just because it's "modern"; use it
// where the static-dispatch benefit is measured and needed.
```

## See Also

- [perf-avoid-virtual-hot-path](perf-avoid-virtual-hot-path.md) - The performance motivation for this pattern
- [tmpl-if-constexpr-branch](tmpl-if-constexpr-branch.md) - Alternative compile-time branching technique
- [anti-void-star-type-erasure](anti-void-star-type-erasure.md) - Contrast with runtime type erasure
