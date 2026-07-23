# proj-include-what-you-use

> `#include` exactly the headers a file directly uses symbols from — never rely on a symbol being transitively available through another header

## Why It Matters

If `a.h` includes `b.h`, and your file includes `a.h` and uses a symbol actually defined in `b.h`, your file compiles today only because `a.h` happens to include `b.h`. The moment `a.h`'s own internals change (it stops needing `b.h`, or reorders its includes), your file breaks with no local changes of its own — a class of build breakage that "include what you use" eliminates entirely.

## Bad

```c
/* my_file.c */
#include "connection.h"   /* connection.h happens to include <string.h> internally */

void copy_name(char *dst, const char *src) {
    strcpy(dst, src);   /* uses strcpy from <string.h>, but never includes it directly */
}
/* Compiles today only because connection.h transitively pulls in <string.h>.
 * If connection.h is refactored to stop needing <string.h>, this file breaks. */
```

## Good

```c
/* my_file.c */
#include <string.h>       /* included directly because this file uses strcpy */
#include "connection.h"

void copy_name(char *dst, const char *src) {
    strcpy(dst, src);
}
```

## Tooling

```sh
# include-what-you-use (IWYU) analyzes actual symbol usage and reports
# missing or superfluous #include directives per translation unit.
include-what-you-use -Xiwyu --verbose=1 my_file.c
```

## See Also

- [proj-avoid-circular-includes](proj-avoid-circular-includes.md) - A related header-hygiene concern
- [name-header-guard-naming](name-header-guard-naming.md) - Ensuring headers are safe to include multiple times
- [proj-header-source-split](proj-header-source-split.md) - Keeping headers minimal makes this discipline easier to follow
