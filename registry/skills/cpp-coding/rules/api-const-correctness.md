# api-const-correctness

> Mark methods/parameters `const` wherever possible

## Why It Matters

`const` on a method promises callers it won't modify observable state, letting them safely call it on `const` objects and reason about aliasing. Const-correctness is contagious in a good way: it lets the compiler catch accidental mutation and documents intent precisely at every layer of an API.

## Bad

```cpp
class Rectangle {
public:
    Rectangle(double w, double h) : width_(w), height_(h) {}

    double area() { return width_ * height_; }   // Not const — can't call on
                                                    // const Rectangle&, even though
                                                    // it never modifies anything
    double width() { return width_; }
    double height() { return height_; }
private:
    double width_, height_;
};

void print_area(const Rectangle& r) {
    std::cout << r.area();   // Compile error: area() isn't const
}
```

## Good

```cpp
class Rectangle {
public:
    Rectangle(double w, double h) : width_(w), height_(h) {}

    double area() const { return width_ * height_; }
    double width() const { return width_; }
    double height() const { return height_; }

    void resize(double w, double h) { width_ = w; height_ = h; }  // Correctly non-const

private:
    double width_, height_;
};

void print_area(const Rectangle& r) {
    std::cout << r.area();   // Compiles: area() is const
}
```

## `const` Parameters and Overload Sets

```cpp
class Container {
public:
    const int& at(size_t i) const { return data_[i]; }  // Read-only access
    int& at(size_t i) { return data_[i]; }               // Mutable access
private:
    std::vector<int> data_;
};
```

## See Also

- [own-const-correctness-ownership](own-const-correctness-ownership.md) - `const` and ownership together
- [api-pass-by-value-sink-ref-view](api-pass-by-value-sink-ref-view.md) - `const&` parameter passing
- [name-boolean-is-has](name-boolean-is-has.md) - Naming conventions that pair with const query methods
