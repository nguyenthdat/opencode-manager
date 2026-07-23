# conc-thread-local-storage

> Use `_Thread_local` (C11) for per-thread state instead of hand-rolled indexing or unsynchronized globals

## Why It Matters

Some state is legitimately per-thread — a scratch buffer, an error code, a random-number generator's seed. Before C11, this required platform-specific APIs (`pthread_key_create`) or an unsafe shared global. `_Thread_local` (and the `<threads.h>` `thread_local` alias) gives every thread its own independent copy of the variable with compiler and linker support, no synchronization needed because no thread ever sees another's copy.

## Bad

```c
static char g_last_error[256];   /* shared across all threads: races and cross-contamination */

void set_last_error(const char *msg) {
    strncpy(g_last_error, msg, sizeof(g_last_error) - 1);
}
```

## Good

```c
#include <threads.h>   /* or <stdint.h>-adjacent _Thread_local directly */

static thread_local char g_last_error[256];   /* one instance per thread */

void set_last_error(const char *msg) {
    strncpy(g_last_error, msg, sizeof(g_last_error) - 1);
    g_last_error[sizeof(g_last_error) - 1] = '\0';
}

const char *get_last_error(void) {
    return g_last_error;   /* always this thread's own value, no lock needed */
}
```

## errno Is Already Thread-Local

```c
/* This is exactly the mechanism modern libc implementations use to make
 * errno safe to use from multiple threads without a global lock. */
```

## Caveats

`thread_local` variables with dynamic (non-constant) initializers, or non-POD-like teardown needs, can be more expensive to access than plain globals on some platforms/toolchains — profile if used on a hot path. Also remember each thread gets its own storage, so it is not a channel for passing data *between* threads; use a mutex-protected structure or a message queue for that.

## See Also

- [err-errno-usage](err-errno-usage.md) - The classic thread-local example
- [conc-mutex-protect-shared-state](conc-mutex-protect-shared-state.md) - The alternative for genuinely shared (not per-thread) state
- [conc-once-init-pthread-once](conc-once-init-pthread-once.md) - One-time initialization, a related but distinct concern
