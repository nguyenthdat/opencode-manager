# tmpl-explicit-instantiation

> Use explicit instantiation to control compile time

## Why It Matters

By default, every translation unit that uses a template instantiates it independently, and the linker deduplicates identical copies afterward — wasting compile time across large builds. Explicit instantiation compiles a template exactly once, in one `.cpp` file, and lets other translation units simply declare (`extern template`) that the instantiation exists elsewhere, avoiding redundant compilation.

## Bad

```cpp
// widget_list.hpp
template <typename T>
class WidgetList {
public:
    void add(T item) { items_.push_back(std::move(item)); }
    // ... substantial implementation inline in the header ...
private:
    std::vector<T> items_;
};

// Every one of 50 .cpp files that #includes this header and uses
// WidgetList<Widget> re-instantiates and re-compiles the entire class.
```

## Good

```cpp
// widget_list.hpp
template <typename T>
class WidgetList {
public:
    void add(T item);
    // ... declarations only ...
};

extern template class WidgetList<Widget>;   // "Don't instantiate here; it's provided elsewhere"

// widget_list.cpp
#include "widget_list.hpp"

template <typename T>
void WidgetList<T>::add(T item) { items_.push_back(std::move(item)); }

template class WidgetList<Widget>;   // Explicit instantiation: compiled exactly once, here
```

## When to Reach for This

Use explicit instantiation for template classes with a small, known set of instantiations used across many translation units (a common pattern in large codebases like LLVM); it's not worth the complexity for templates used in only one or two places.

## See Also

- [tmpl-avoid-bloat](tmpl-avoid-bloat.md) - Reducing instantiation bloat more generally
- [proj-precompiled-headers-large-builds](proj-precompiled-headers-large-builds.md) - Other build-time mitigation techniques
- [proj-header-source-split](proj-header-source-split.md) - Splitting declarations from definitions
