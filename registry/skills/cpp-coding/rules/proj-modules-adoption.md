# proj-modules-adoption

> Consider C++20 modules where toolchain support allows

## Why It Matters

Modules replace textual `#include` with a semantic import mechanism (`import my_module;`): each module is compiled once into a binary interface, eliminating repeated re-parsing of headers across translation units and removing macro/preprocessor leakage between modules. This can meaningfully improve build times on large codebases — but build-system and compiler support (CMake, MSVC, GCC, Clang) is still maturing as of C++20/23 adoption, so evaluate carefully before committing a project to modules.

## Traditional Header Approach (Safe Default)

```cpp
// widget.hpp
#pragma once
class Widget {
public:
    void render();
};

// main.cpp
#include "widget.hpp"
```

## Modules Approach (C++20, When Toolchain Support Is Confirmed)

```cpp
// widget.cppm (module interface unit)
export module widget;

export class Widget {
public:
    void render();
};

// main.cpp
import widget;

int main() {
    Widget w;
    w.render();
}
```

## Decision Guide

| Consideration | Favor headers | Favor modules |
|---|---|---|
| Build system CMake version | < 3.28 | >= 3.28 with confirmed generator support |
| Compiler | Mixed/older toolchains | Recent GCC/Clang/MSVC, single well-supported compiler |
| Team familiarity | Established header workflow | Team ready to adopt new tooling |
| Build time is a proven bottleneck | Not yet measured | Measured and modules shown to help |

## Practical Guidance

Don't migrate an established, working header-based build to modules speculatively; evaluate on a new project or an isolated component first, and confirm your specific CMake/compiler/IDE combination fully supports the workflow (debugging, incremental builds, IDE indexing) before committing broadly.

## See Also

- [proj-header-source-split](proj-header-source-split.md) - The traditional approach modules aim to improve on
- [proj-cmake-target-based](proj-cmake-target-based.md) - Build system support required for modules
- [proj-precompiled-headers-large-builds](proj-precompiled-headers-large-builds.md) - An interim mitigation with mature tooling support
