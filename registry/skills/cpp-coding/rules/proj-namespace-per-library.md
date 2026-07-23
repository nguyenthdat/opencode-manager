# proj-namespace-per-library

> Wrap library code in a project namespace

## Why It Matters

Without a namespace, every global-scope symbol a library defines can collide with an identically-named symbol from another library or the application itself — a link error at best, silent misbehavior at worst if names happen to match with incompatible signatures. Wrapping a whole library's public API in a single project-specific namespace eliminates this entire class of collision.

## Bad

```cpp
// mylib/widget.hpp — no namespace
class Widget { /* ... */ };
void render(Widget& w);

// Another library, or the application itself, also happens to define:
class Widget { /* completely unrelated */ };   // Symbol collision / confusion
```

## Good

```cpp
// mylib/widget.hpp
namespace mylib {

class Widget { /* ... */ };
void render(Widget& w);

}  // namespace mylib

// Usage
mylib::Widget w;
mylib::render(w);

// Or selectively bring in just what's needed:
using mylib::Widget;
```

## Nested Namespaces for Internal-Only Code

```cpp
namespace mylib {

void public_api();

namespace detail {   // Convention: signals "implementation detail, not part
    void helper();    // of the public API," even though it's technically accessible
}

}  // namespace mylib
```

## Avoid `using namespace` in Headers

```cpp
// Never do this in a header — it pollutes every file that includes it:
// using namespace mylib;   // WRONG in a header
// See anti-using-namespace-std-header for the specific std:: case.
```

## See Also

- [name-namespace-lower-snake](name-namespace-lower-snake.md) - Naming convention for the namespace itself
- [anti-using-namespace-std-header](anti-using-namespace-std-header.md) - The specific anti-pattern this rule helps avoid
- [proj-separate-public-private-headers](proj-separate-public-private-headers.md) - Structuring the public API this namespace exposes
