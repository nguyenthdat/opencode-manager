# anti-slicing-by-value

> Don't pass/store polymorphic types by value

## Why It Matters

Assigning or passing a derived object into a base-class-by-value variable or parameter copies only the base class portion — the derived-specific data and its overridden virtual dispatch are silently discarded ("object slicing"). The resulting object behaves as a plain base instance, often surprising code that expected polymorphic behavior to be preserved.

## Bad

```cpp
class Shape { public: virtual double area() const { return 0; } };
class Circle : public Shape {
public:
    explicit Circle(double r) : radius_(r) {}
    double area() const override { return 3.14159 * radius_ * radius_; }
private:
    double radius_;
};

void print_area(Shape s) {   // By value: slices any derived type down to Shape
    std::cout << s.area();    // Always calls Shape::area(), never Circle::area()
}

Circle c(5.0);
print_area(c);   // Prints 0, not the circle's actual area — silent slicing bug
```

## Good

```cpp
void print_area(const Shape& s) {   // Reference: no slicing, virtual dispatch works
    std::cout << s.area();            // Correctly calls Circle::area() via the vtable
}

print_area(c);   // Prints the correct area
```

## See Also

- [anti-non-virtual-destructor-base](anti-non-virtual-destructor-base.md) - Another polymorphic-base-class pitfall
- [err-catch-by-const-ref](err-catch-by-const-ref.md) - The same slicing hazard in exception handling
- [own-raw-pointer-non-owning](own-raw-pointer-non-owning.md) - Passing polymorphic types by reference/pointer
