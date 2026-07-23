# type-bool-stdbool

> Use `bool` from `<stdbool.h>` (C99) for boolean values, not a bare `int` with implied `0`/`1` meaning

## Why It Matters

Before `<stdbool.h>`, C had no boolean type, so codebases used `int` with an implicit "0 is false, nonzero is true" convention, or hand-rolled a `typedef int bool;` that could collide with the real thing once C99 support was assumed. `bool`/`true`/`false` make boolean intent explicit in the type itself, are exactly 1 byte typically (vs. `int`'s usual 4), and are portable and standard since C99 (a keyword directly since C23).

## Bad

```c
int is_valid(const struct config *cfg) {
    return cfg->timeout_ms > 0 ? 1 : 0;   /* meaning of the returned int is only a convention */
}

int flag = 5;             /* "true" per the 0/nonzero convention, but obscures intent — why 5? */
if (flag) { ... }
```

## Good

```c
#include <stdbool.h>

bool is_valid(const struct config *cfg) {
    return cfg->timeout_ms > 0;   /* true/false, unambiguous type and intent */
}

bool enabled = true;
if (enabled) { ... }
```

## bool in Structs Saves Space Too

```c
struct flags {
    bool verbose;      /* 1 byte each, vs 4 bytes for `int verbose;` */
    bool dry_run;
    bool force;
};
```

## C23: bool, true, false Become Keywords

C23 makes `bool`, `true`, and `false` predefined keywords (no `#include <stdbool.h>` required), while keeping `<stdbool.h>` available for backward compatibility with pre-C23 code that already includes it.

## See Also

- [name-boolean-is-has-prefix](name-boolean-is-has-prefix.md) - Naming convention for boolean-returning functions
- [type-fixed-width-stdint](type-fixed-width-stdint.md) - Related explicit-type-width guidance
- [type-struct-designated-init](type-struct-designated-init.md) - Initializing structs containing bool fields clearly
