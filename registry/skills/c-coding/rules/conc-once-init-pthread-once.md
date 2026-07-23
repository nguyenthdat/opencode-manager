# conc-once-init-pthread-once

> Use `pthread_once` (or a `static` local with C11's guaranteed thread-safe initialization) for one-time, thread-safe lazy initialization

## Why It Matters

Lazily initializing shared state ("initialize on first use") from multiple threads without coordination risks two threads both seeing "not yet initialized" and both performing the initialization — a race that can double-allocate resources or leave the state partially constructed for one of the threads. `pthread_once` guarantees the initializer function runs exactly once, no matter how many threads call it concurrently.

## Bad

```c
static struct config *g_config = NULL;

struct config *get_config(void) {
    if (!g_config) {                 /* two threads can both pass this check */
        g_config = config_load();     /* both allocate/load: leak + race */
    }
    return g_config;
}
```

## Good

```c
#include <pthread.h>

static struct config *g_config = NULL;
static pthread_once_t g_config_once = PTHREAD_ONCE_INIT;

static void init_config(void) {
    g_config = config_load();   /* guaranteed to run exactly once across all threads */
}

struct config *get_config(void) {
    pthread_once(&g_config_once, init_config);
    return g_config;
}
```

## C11 Alternative: Function-Local static

```c
/* C11 guarantees that initialization of a block-scope static variable with a
 * dynamic initializer is thread-safe (no concurrent double-init), without an
 * explicit pthread_once call. */
struct config *get_config(void) {
    static struct config *cfg = NULL;
    static pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
    pthread_mutex_lock(&lock);
    if (!cfg) {
        cfg = config_load();
    }
    pthread_mutex_unlock(&lock);
    return cfg;
}
```

## See Also

- [conc-mutex-protect-shared-state](conc-mutex-protect-shared-state.md) - General mutual-exclusion primitive
- [conc-thread-local-storage](conc-thread-local-storage.md) - Per-thread alternative when sharing isn't needed
- [api-init-cleanup-pair](api-init-cleanup-pair.md) - Broader init/cleanup API conventions
