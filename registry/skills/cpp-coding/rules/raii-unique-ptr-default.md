# raii-unique-ptr-default

> Default to `unique_ptr` for sole ownership

## Why It Matters

`unique_ptr` has zero runtime overhead over a raw pointer (no atomic refcount, no control block) and makes ownership explicit and exclusive at the type level. Starting with `unique_ptr` and only promoting to `shared_ptr` when genuine shared ownership is proven keeps ownership graphs simple and easy to reason about.

## Bad

```cpp
class Widget {
public:
    Widget() : impl_(new Impl()) {}
    ~Widget() { delete impl_; }   // Manual, easy to forget on every path
private:
    Impl* impl_;
};

Widget* create_widget() {
    return new Widget();   // Who deletes this? Unclear from the signature.
}
```

## Good

```cpp
#include <memory>

class Widget {
public:
    Widget() : impl_(std::make_unique<Impl>()) {}
    // Destructor, move ctor/assign all compiler-generated correctly (Rule of Zero)
private:
    std::unique_ptr<Impl> impl_;
};

std::unique_ptr<Widget> create_widget() {
    return std::make_unique<Widget>();  // Signature makes ownership transfer explicit
}
```

## Transferring Ownership

```cpp
class Registry {
public:
    void add(std::unique_ptr<Widget> w) {
        widgets_.push_back(std::move(w));  // Ownership moves into the registry
    }
private:
    std::vector<std::unique_ptr<Widget>> widgets_;
};

void demo() {
    auto w = std::make_unique<Widget>();
    Registry r;
    r.add(std::move(w));   // w is now null; r owns the Widget
}
```

## See Also

- [own-unique-ptr-sole](own-unique-ptr-sole.md) - Ownership semantics and decision criteria
- [own-make-unique-shared](own-make-unique-shared.md) - Always construct via `make_unique`
- [raii-rule-of-zero](raii-rule-of-zero.md) - Wrapping a resource in `unique_ptr` regains Rule of Zero
