# type-dynamic-cast-polymorphic

> Use `dynamic_cast`/visitor over manual type tags

## Why It Matters

A manual "type tag" field on a base class (an enum indicating which derived type an object actually is) requires every derived type addition to remember to update the tag and every switch over it, and provides no compiler enforcement that the tag actually matches the object's real type. `dynamic_cast` uses the language's built-in RTTI to perform a checked downcast, failing safely (`nullptr` or an exception) if the cast is wrong.

## Bad

```cpp
enum class ShapeTag { Circle, Square };

struct Shape {
    ShapeTag tag;
    virtual ~Shape() = default;
};

struct Circle : Shape { Circle() { tag = ShapeTag::Circle; } double radius; };
struct Square : Shape { Square() { tag = ShapeTag::Square; } double side; };

void process(Shape* s) {
    if (s->tag == ShapeTag::Circle) {
        Circle* c = static_cast<Circle*>(s);   // No runtime check: if the tag is
        use(c->radius);                          // ever wrong (forgotten update
    }                                              // after adding a new derived type),
}                                                    // this is silent UB.
```

## Good

```cpp
struct Shape { virtual ~Shape() = default; };
struct Circle : Shape { double radius; };
struct Square : Shape { double side; };

void process(Shape* s) {
    if (auto* c = dynamic_cast<Circle*>(s)) {
        use(c->radius);   // Runtime-checked: only succeeds if s really is a Circle
    } else if (auto* sq = dynamic_cast<Square*>(s)) {
        use(sq->side);
    }
}
```

## Prefer Virtual Dispatch or `std::variant`+`visit` When You Control the Type Set

```cpp
// If you own the full closed set of derived types, a virtual method or a
// std::variant with std::visit (compiler-enforced exhaustiveness) is often
// preferable to any downcasting at all:
struct Shape { virtual double area() const = 0; virtual ~Shape() = default; };
struct Circle : Shape { double radius; double area() const override { return 3.14159 * radius * radius; } };
```

## See Also

- [type-avoid-c-style-cast](type-avoid-c-style-cast.md) - Named casts in general
- [type-variant-over-union](type-variant-over-union.md) - `std::variant`+`visit` as a closed-set alternative
- [anti-non-virtual-destructor-base](anti-non-virtual-destructor-base.md) - Polymorphic base class requirements
