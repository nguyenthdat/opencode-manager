# api-pimpl-abi-stability

> Use PIMPL for ABI-stable shared libraries

## Why It Matters

Any private data member's type, size, or layout is part of a class's ABI: adding, removing, or reordering a private member changes the class's size/layout and breaks binary compatibility with code compiled against the old header, even though no public interface changed. The Pointer-to-IMPLementation (PIMPL) idiom hides all private data behind a single opaque pointer, so the public header's ABI never changes when internal implementation details do.

## Bad

```cpp
// widget.hpp — shipped as part of a shared library's public headers
class Widget {
public:
    void render();
private:
    std::vector<Vertex> vertices_;   // Adding a field here changes sizeof(Widget),
    Texture texture_;                 // breaking every binary compiled against
    Shader shader_;                   // the old header — an ABI break.
};
```

## Good

```cpp
// widget.hpp — public header, ABI-stable
class Widget {
public:
    Widget();
    ~Widget();
    Widget(Widget&&) noexcept;
    Widget& operator=(Widget&&) noexcept;

    void render();

private:
    class Impl;
    std::unique_ptr<Impl> impl_;   // Only a pointer is part of the ABI —
};                                   // its size never changes as Impl evolves

// widget.cpp — internal, can change freely without breaking ABI
class Widget::Impl {
public:
    std::vector<Vertex> vertices;
    Texture texture;
    Shader shader;
    // New fields added here don't affect Widget's binary layout at all
};

Widget::Widget() : impl_(std::make_unique<Impl>()) {}
Widget::~Widget() = default;
Widget::Widget(Widget&&) noexcept = default;
Widget& Widget::operator=(Widget&&) noexcept = default;

void Widget::render() { /* uses impl_->vertices, etc. */ }
```

## Trade-off

PIMPL adds one heap allocation and one indirection per object; use it deliberately for genuinely ABI-sensitive public library boundaries, not for every internal class.

## See Also

- [api-avoid-stl-across-abi](api-avoid-stl-across-abi.md) - Related ABI-stability concern for STL types
- [proj-separate-public-private-headers](proj-separate-public-private-headers.md) - Header organization supporting this pattern
- [own-unique-ptr-sole](own-unique-ptr-sole.md) - `unique_ptr` as the mechanism behind PIMPL
