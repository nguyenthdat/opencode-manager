# test-static-functions-via-include

> Test `static` (internal-linkage) helper functions either by `#include`-ing the `.c` file directly into a test-only translation unit, or by exposing them through a test-only internal header

## Why It Matters

`static` functions are invisible outside their translation unit — the right default for internal helpers, but it also means an ordinary external test binary linked against the library cannot call them directly. Testing them still matters (they often contain the trickiest logic), so you need a deliberate, narrow escape hatch that doesn't widen the public API just to make testing possible.

## Bad

```c
/* Removing `static` from every helper just so tests can link against it,
 * permanently widening the public API and defeating api-minimal-public-surface. */
int validate_name(const char *name) { ... }   /* no longer static: now part of the real ABI, forever */
```

## Good — Option 1: #include the .c File Into a Test Translation Unit

```c
/* test_widget_internal.c */
#include "widget.c"   /* pulls in static helpers with full visibility, for this test file only */

void test_validate_name_rejects_empty(void) {
    assert(validate_name("") == false);   /* calling the static function directly */
}
```

## Good — Option 2: A Test-Only Internal Header

```c
/* widget_internal.h — not installed, not part of the public API,
 * shipped only alongside the source tree for test builds. */
#ifndef WIDGET_INTERNAL_H
#define WIDGET_INTERNAL_H
bool validate_name(const char *name);   /* declared here, defined non-static in widget.c */
#endif
```

```c
/* widget.c */
#include "widget_internal.h"
bool validate_name(const char *name) { ... }   /* non-static, but only exposed via the internal header */
```

## Prefer Testing Through the Public API Where Practical

Reach for these techniques only for logic that genuinely can't be exercised adequately through the public functions that call it — testing through the real public API keeps tests aligned with how the code is actually used.

## See Also

- [api-minimal-public-surface](api-minimal-public-surface.md) - Why these helpers were `static` in the first place
- [proj-public-vs-private-headers-dir](proj-public-vs-private-headers-dir.md) - Where an internal test header belongs
- [test-integration-test-separate-binary](test-integration-test-separate-binary.md) - The public-API-only alternative
