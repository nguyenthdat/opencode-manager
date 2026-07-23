# proj-separate-public-private-headers

> Separate public and internal headers

## Why It Matters

Mixing a library's genuinely public API headers with internal-only implementation headers in the same directory makes it unclear (to both humans and the build system) what consumers are actually meant to depend on, and risks accidentally exposing implementation details as if they were stable API.

## Bad

```
mylib/
  widget.hpp          # Public API
  widget_internal.hpp  # Implementation detail, but sits right next to public headers
  renderer.hpp          # Public API
  gpu_state_cache.hpp    # Implementation detail — nothing distinguishes it from the above
```

## Good

```
mylib/
  include/mylib/       # Public API: what consumers #include and link against
    widget.hpp
    renderer.hpp
  src/                   # Implementation: private headers + .cpp files
    widget_internal.hpp
    gpu_state_cache.hpp
    widget.cpp
    renderer.cpp
```

```cmake
add_library(mylib src/widget.cpp src/renderer.cpp)
target_include_directories(mylib
    PUBLIC  ${CMAKE_CURRENT_SOURCE_DIR}/include    # Only public headers exposed to consumers
    PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src          # Internal headers stay internal
)
```

## Consumers Only See the Public Surface

```cpp
// A consumer of mylib can only reasonably discover and #include:
#include <mylib/widget.hpp>     // Public, stable, documented
// #include <mylib/gpu_state_cache.hpp>  // Not on the include path at all for consumers
```

## See Also

- [proj-cmake-target-based](proj-cmake-target-based.md) - `PUBLIC`/`PRIVATE` include directories in depth
- [api-pimpl-abi-stability](api-pimpl-abi-stability.md) - Further hiding implementation details from the public header
- [proj-namespace-per-library](proj-namespace-per-library.md) - Namespacing the public API this layout exposes
