# proj-minimal-includes

> Include only what you use; forward-declare

## Why It Matters

Every `#include` in a header is transitively included by every file that includes that header, compounding compile time across the whole dependency graph. Including a heavy header "just in case," or because a transitively-included header happens to provide something you use directly, creates hidden coupling that breaks the moment an unrelated header is refactored to include less.

## Bad

```cpp
// widget.hpp
#include <iostream>      // Not actually used in this header at all
#include <vector>         // Only need this for a forward-declarable pointer member
#include "renderer.hpp"   // Full definition included, but only a pointer is stored

class Widget {
public:
    Renderer* renderer;   // Only needs Renderer* — doesn't need the full definition
    std::vector<int> ids;  // Genuinely needs the full std::vector definition
};
```

## Good

```cpp
// widget.hpp
#include <vector>   // Needed: std::vector is used by value

class Renderer;      // Forward declaration: only a pointer is stored here

class Widget {
public:
    Renderer* renderer;
    std::vector<int> ids;
};

// widget.cpp
#include "widget.hpp"
#include "renderer.hpp"   // Full definition included where Renderer is actually used
```

## Include What You Use (IWYU), Not What You Get Transitively

```cpp
// If this file uses std::string, #include <string> directly — don't rely
// on it arriving transitively via another header, which could change:
#include <string>   // Explicit: this file directly uses std::string
#include <vector>   // Explicit: this file directly uses std::vector
```

## See Also

- [proj-avoid-circular-includes](proj-avoid-circular-includes.md) - Forward declarations breaking include cycles too
- [lint-include-what-you-use-tool](lint-include-what-you-use-tool.md) - Automated tooling for enforcing this rule
- [proj-header-source-split](proj-header-source-split.md) - Moving full includes to `.cpp` files
