# proj-internal-header-naming

> Name and locate internal-only headers so they are obviously not part of the public API — e.g. an `internal/` subdirectory or an `_internal.h` suffix

## Why It Matters

A library's source tree often contains headers shared between its own `.c` files but never meant for external consumers (shared constants, private struct definitions, test-only declarations). Without a clear naming/location convention, it's easy for a consumer (or an IDE's auto-include suggestion) to `#include` an internal header directly, creating an accidental dependency on unstable internals.

## Bad

```
include/
  widget.h            # public
  widget_helpers.h      # actually private, but sits right next to the public header with no signal
```

## Good

```
include/
  widget.h              # public API only; this is what gets installed/shipped
src/
  widget.c
  internal/
    widget_helpers.h      # clearly internal by location; never installed, never in the public include path
```

```c
/* src/widget.c */
#include "widget.h"              /* public API, from the install/include path */
#include "internal/widget_helpers.h"  /* internal, from the source tree only */
```

## Enforce at the Build System Level

```cmake
# Only include/ is added to the public include path that gets installed;
# src/internal/ is only visible to the library's own source files.
target_include_directories(widget PUBLIC include)
target_include_directories(widget PRIVATE src)
```

## See Also

- [proj-public-vs-private-headers-dir](proj-public-vs-private-headers-dir.md) - The broader directory-layout convention this fits into
- [api-minimal-public-surface](api-minimal-public-surface.md) - The goal this naming convention supports
- [test-static-functions-via-include](test-static-functions-via-include.md) - A related test-only internal-header use case
