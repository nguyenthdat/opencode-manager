# proj-include-guards-pragma-once

> Use `#pragma once` in every header

## Why It Matters

If a header is included more than once in the same translation unit (directly, or transitively through other headers), its declarations are seen twice — for a class or function definition, this is a compile error ("redefinition"). An inclusion guard ensures the header's contents are only processed once per translation unit regardless of how many times it's `#include`d.

## Bad

```cpp
// widget.hpp — no guard at all
class Widget {
public:
    void render();
};

// a.hpp
#include "widget.hpp"

// b.hpp
#include "widget.hpp"

// main.cpp
#include "a.hpp"
#include "b.hpp"   // widget.hpp is now included twice — "redefinition of class Widget"
```

## Good — `#pragma once`

```cpp
// widget.hpp
#pragma once

class Widget {
public:
    void render();
};
```

## Traditional Include Guards (Equivalent, More Portable but Verbose)

```cpp
#ifndef MYPROJECT_WIDGET_HPP
#define MYPROJECT_WIDGET_HPP

class Widget {
public:
    void render();
};

#endif  // MYPROJECT_WIDGET_HPP
```

## Practical Guidance

`#pragma once` is supported by every major compiler (GCC, Clang, MSVC) and is less error-prone (no risk of a copy-pasted, duplicate macro name across two different headers) than manually-named include guards; most modern codebases (LLVM, Chromium) use it. Traditional guards remain the more strictly standard-compliant option and are still common in codebases requiring maximal portability.

## See Also

- [proj-avoid-circular-includes](proj-avoid-circular-includes.md) - A related, more subtle inclusion hazard
- [proj-minimal-includes](proj-minimal-includes.md) - Reducing how much header content needs guarding in the first place
- [proj-header-source-split](proj-header-source-split.md) - Keeping headers lean by moving definitions to `.cpp`
