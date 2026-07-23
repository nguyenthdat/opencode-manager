# proj-header-source-split

> Separate a module's public declarations (`.h`) from its implementation (`.c`), and keep only what consumers genuinely need in the header

## Why It Matters

The header is a module's contract with the rest of the codebase — everything in it becomes something callers can (and eventually will) depend on. Keeping implementation details in the `.c` file lets you change them freely; leaking them into the header (helper functions, internal struct fields, private macros) turns implementation details into an accidental part of the public contract.

## Bad

```c
/* widget.h */
#include <pthread.h>

struct widget {
    int id;
    char name[64];
    pthread_mutex_t internal_lock;   /* implementation detail leaked into the public header */
};

int  compute_hash(const char *name);   /* internal helper, shouldn't be in the public header at all */
widget *widget_create(const char *name);
```

## Good

```c
/* widget.h — only what consumers need */
typedef struct widget widget;   /* opaque; implementation details stay in widget.c */

widget *widget_create(const char *name);
void    widget_destroy(widget *w);
int     widget_id(const widget *w);
```

```c
/* widget.c — implementation, including the real struct and private helpers */
#include "widget.h"
#include <pthread.h>

struct widget {
    int id;
    char name[64];
    pthread_mutex_t internal_lock;
};

static int compute_hash(const char *name) { ... }   /* static: never leaks outside this file */

widget *widget_create(const char *name) { ... }
```

## See Also

- [api-opaque-struct-encapsulation](api-opaque-struct-encapsulation.md) - The opaque-type technique shown above
- [api-minimal-public-surface](api-minimal-public-surface.md) - Deciding what belongs in the header at all
- [proj-public-vs-private-headers-dir](proj-public-vs-private-headers-dir.md) - Directory-level organization of this split
