# proj-header-source-split

> Split declarations from definitions

## Why It Matters

Keeping non-template class/function definitions in a `.cpp` file (with only declarations in the `.hpp`) means changing a function's implementation only requires recompiling that one `.cpp` file, not every translation unit that includes the header — dramatically reducing incremental build times in larger projects.

## Bad

```cpp
// widget.hpp
class Widget {
public:
    void render() {
        // Substantial implementation directly in the header...
        setup_gpu_state();
        bind_shaders();
        draw_geometry();
        // Every .cpp file that includes widget.hpp recompiles all of this
        // whenever ANY of it changes, even a one-line tweak.
    }
};
```

## Good

```cpp
// widget.hpp
class Widget {
public:
    void render();   // Declaration only
};

// widget.cpp
#include "widget.hpp"

void Widget::render() {
    setup_gpu_state();
    bind_shaders();
    draw_geometry();
}   // Changing this only recompiles widget.cpp and re-links dependents
```

## Templates Are the Exception (Usually Must Stay in the Header)

```cpp
// Template definitions generally must be visible at every instantiation
// point, so they typically stay in the header (or a .ipp/-inl included by
// it) unless using explicit instantiation — see tmpl-explicit-instantiation.
template <typename T>
class Container {
public:
    void add(T value) { data_.push_back(std::move(value)); }  // Stays in header
private:
    std::vector<T> data_;
};
```

## See Also

- [tmpl-explicit-instantiation](tmpl-explicit-instantiation.md) - Moving template definitions out of headers deliberately
- [proj-minimal-includes](proj-minimal-includes.md) - Reducing header-inclusion cost further
- [proj-precompiled-headers-large-builds](proj-precompiled-headers-large-builds.md) - Additional build-time mitigation
