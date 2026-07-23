# anti-non-virtual-destructor-base

> Don't give a polymorphic base a public non-virtual destructor

## Why It Matters

Deleting a derived object through a base class pointer calls only the base class's destructor if it isn't `virtual` — the derived class's destructor (and therefore its members' destructors) never runs, leaking any resources the derived class owns and leaving its state only partially torn down.

## Bad

```cpp
class Shape {
public:
    ~Shape() {}   // Not virtual!
    virtual double area() const = 0;
};

class Circle : public Shape {
public:
    Circle() : buffer_(std::make_unique<int[]>(100)) {}
    double area() const override { return 3.14159; }
private:
    std::unique_ptr<int[]> buffer_;
};

Shape* s = new Circle();
delete s;   // Only ~Shape() runs — Circle's buffer_ destructor never runs!
```

## Good

```cpp
class Shape {
public:
    virtual ~Shape() = default;   // Virtual: derived destructor is called correctly
    virtual double area() const = 0;
};

Shape* s = new Circle();
delete s;   // ~Circle() runs first (destroying buffer_ correctly), then ~Shape()

// Even better: avoid raw ownership through a base pointer entirely
std::unique_ptr<Shape> s2 = std::make_unique<Circle>();
```

## See Also

- [raii-rule-of-five](raii-rule-of-five.md) - Destructor design in the context of resource ownership
- [own-unique-ptr-sole](own-unique-ptr-sole.md) - Owning polymorphic objects safely via `unique_ptr`
- [type-dynamic-cast-polymorphic](type-dynamic-cast-polymorphic.md) - Other polymorphic base class considerations
