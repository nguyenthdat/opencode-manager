# type-static-assert-invariants

> Use `static_assert` (C11, standard keyword in C23) to verify type-layout and configuration invariants at compile time instead of discovering violations at runtime

## Why It Matters

Some invariants — a struct's size matching a wire-format spec, an enum count matching an array's length, a type being wide enough to hold an expected range — are true facts about the build, not about runtime data. Checking them with `static_assert` fails the build immediately with a clear message if a refactor or a different platform's type widths ever break the assumption, rather than surfacing as a subtle bug or corrupted data much later.

## Bad

```c
struct wire_header {
    uint8_t  version;
    uint8_t  flags;
    uint16_t length;
};
/* Assumed to be exactly 4 bytes for the wire protocol, but nothing enforces
 * this — a future field addition or unexpected padding breaks it silently. */
```

## Good

```c
#include <assert.h>   /* static_assert is available via <assert.h> in C11/C17;
                        * it's a keyword directly in C23, no include needed */

struct wire_header {
    uint8_t  version;
    uint8_t  flags;
    uint16_t length;
};
static_assert(sizeof(struct wire_header) == 4, "wire_header must stay exactly 4 bytes");

enum color { RED, GREEN, BLUE, COLOR_COUNT };
static const char *color_names[] = { "red", "green", "blue" };
static_assert(sizeof(color_names) / sizeof(color_names[0]) == COLOR_COUNT,
              "color_names must have one entry per color enum value");
```

## Checking Platform Assumptions

```c
static_assert(sizeof(void *) == 8, "this code assumes a 64-bit pointer width");
static_assert(CHAR_BIT == 8, "this code assumes 8-bit bytes");
```

## See Also

- [mem-struct-padding-awareness](mem-struct-padding-awareness.md) - The layout facts this rule verifies
- [err-assert-vs-runtime-check](err-assert-vs-runtime-check.md) - `static_assert` vs runtime `assert` vs runtime error handling
- [type-fixed-width-stdint](type-fixed-width-stdint.md) - Types whose exact width these assertions often verify
