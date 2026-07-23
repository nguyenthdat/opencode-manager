# perf-avoid-virtual-hot-path

> Avoid virtual dispatch in hot inner loops

## Why It Matters

A virtual call requires a vtable lookup and an indirect call through a function pointer, which the compiler generally cannot inline — in a loop executed millions of times per frame/request, this indirect-call overhead (and the missed inlining opportunities it causes) can be measurable. Reserve virtual dispatch for genuinely polymorphic, infrequently-called boundaries; use templates/CRTP for statically-known types in hot loops.

## Bad

```cpp
class ShapeBase {
public:
    virtual double area() const = 0;
    virtual ~ShapeBase() = default;
};

double total_area(const std::vector<std::unique_ptr<ShapeBase>>& shapes) {
    double total = 0;
    for (const auto& s : shapes) {
        total += s->area();   // Virtual call per element, every frame, in a hot loop
    }
    return total;
}
```

## Good — Static Dispatch When the Type Set Is Known and This Is Actually Hot

```cpp
template <typename ShapeContainer>
double total_area(const ShapeContainer& shapes) {   // e.g. std::vector<Circle>
    double total = 0;
    for (const auto& s : shapes) {
        total += s.area();   // Direct call: inlinable, no vtable lookup
    }
    return total;
}
```

## Good — CRTP When You Need a Shared Interface Without Virtual Cost

```cpp
template <typename Derived>
struct ShapeBase {
    double area() const { return static_cast<const Derived*>(this)->area_impl(); }
};

struct Circle : ShapeBase<Circle> {
    double radius;
    double area_impl() const { return 3.14159 * radius * radius; }
};
```

## Measure First

```cpp
// Virtual dispatch overhead is often negligible outside genuinely hot,
// tight loops (millions of calls per second). Profile before restructuring
// a design around this concern — see perf-profile-before-optimize.
```

## See Also

- [tmpl-crtp-static-polymorphism](tmpl-crtp-static-polymorphism.md) - CRTP pattern in depth
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Confirming this is actually the bottleneck
- [api-interface-segregation](api-interface-segregation.md) - When virtual dispatch is the right design choice regardless
