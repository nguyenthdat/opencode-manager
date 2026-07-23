# proj-public-vs-private-headers-dir

> Physically separate a library's public headers (installed, part of the API) from its private/internal headers (never installed) using distinct directories

## Why It Matters

A directory-level split makes the public/private boundary enforceable by the build and packaging system, not just by convention or comment — you can literally only install/ship the `include/` directory's contents, guaranteeing consumers never gain a path to an internal header, and making an accidental "leak" of an internal header into the install step an obvious build-configuration bug rather than a silent mistake.

## Bad

```
mylib/
  widget.h            # public
  widget_impl.h         # private, but sitting in the same directory with no distinction
  widget.c
```

## Good

```
mylib/
  include/
    mylib/
      widget.h          # public API; consumers #include <mylib/widget.h>
  src/
    widget.c
    widget_impl.h        # private; never installed, only visible within src/
```

```cmake
# CMakeLists.txt
target_include_directories(mylib
    PUBLIC  include              # only this is exposed to consumers / installed
    PRIVATE src                    # widget_impl.h is only visible while building mylib itself
)
install(DIRECTORY include/ DESTINATION include)   # src/ is never installed
```

## Namespacing the Public Include Path

Including the library name in the public include path (`mylib/widget.h` rather than a bare `widget.h`) additionally reduces the chance of a filename collision with another library's headers once both are installed system-wide.

## See Also

- [proj-internal-header-naming](proj-internal-header-naming.md) - Naming/locating private headers specifically
- [api-minimal-public-surface](api-minimal-public-surface.md) - The goal this directory split enforces mechanically
- [proj-build-system-cmake-makefile](proj-build-system-cmake-makefile.md) - Wiring this split into the actual build
