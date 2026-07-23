# conc-avoid-data-races

> Treat any variable touched by more than one thread as requiring explicit synchronization, with no implicit exceptions

## Why It Matters

A data race — two threads accessing the same memory location without synchronization, at least one being a write — is undefined behavior under the C11 memory model, whether or not it happens to "work" on your platform. The observed effects are not limited to a torn read; the compiler is permitted to assume racy code paths are unreachable and generate code accordingly, which is qualitatively worse than a merely wrong value.

## Bad

```c
struct cache {
    char *data;
    size_t len;
};
static struct cache g_cache;

void update_cache(char *new_data, size_t len) {   /* thread A */
    g_cache.data = new_data;
    g_cache.len = len;
}

void read_cache(void) {                              /* thread B, concurrently */
    printf("%.*s\n", (int)g_cache.len, g_cache.data);  /* may see a torn/inconsistent (data, len) pair */
}
```

## Good

```c
struct cache {
    char *data;
    size_t len;
};
static struct cache g_cache;
static pthread_mutex_t g_cache_lock = PTHREAD_MUTEX_INITIALIZER;

void update_cache(char *new_data, size_t len) {
    pthread_mutex_lock(&g_cache_lock);
    g_cache.data = new_data;
    g_cache.len = len;
    pthread_mutex_unlock(&g_cache_lock);
}

void read_cache(void) {
    pthread_mutex_lock(&g_cache_lock);
    printf("%.*s\n", (int)g_cache.len, g_cache.data);   /* always a consistent pair */
    pthread_mutex_unlock(&g_cache_lock);
}
```

## Detecting Races Automatically

```sh
cc -fsanitize=thread -g -O1 -o test_bin test.c
./test_bin   # ThreadSanitizer reports the exact racing accesses and both thread stacks
```

## See Also

- [conc-mutex-protect-shared-state](conc-mutex-protect-shared-state.md) - The primary tool for preventing races
- [conc-atomic-for-flags-counters](conc-atomic-for-flags-counters.md) - Lock-free option for single variables
- [lint-thread-sanitizer](lint-thread-sanitizer.md) - CI integration for race detection
