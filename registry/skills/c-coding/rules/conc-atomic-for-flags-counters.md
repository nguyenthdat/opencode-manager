# conc-atomic-for-flags-counters

> Use C11 `_Atomic` (or `<stdatomic.h>`) for simple shared flags and counters instead of a mutex

## Why It Matters

Locking a mutex for a single increment or flag check is comparatively expensive and, if you forget to lock even once, silently reintroduces a data race. C11's `<stdatomic.h>` provides atomic types and operations with well-defined memory-ordering semantics, letting the compiler/hardware generate a single atomic instruction instead of lock/unlock overhead for these simple cases.

## Bad

```c
static int shutdown_requested = 0;   /* plain int read/written from multiple threads: data race */

void request_shutdown(void) { shutdown_requested = 1; }
int should_stop(void) { return shutdown_requested; }
```

## Good

```c
#include <stdatomic.h>

static atomic_int shutdown_requested = 0;

void request_shutdown(void) {
    atomic_store(&shutdown_requested, 1);
}
int should_stop(void) {
    return atomic_load(&shutdown_requested);
}
```

## Atomic Counter

```c
#include <stdatomic.h>

static atomic_long total_requests = 0;

void on_request(void) {
    atomic_fetch_add(&total_requests, 1);   /* single atomic RMW instruction, no lock */
}

long request_count(void) {
    return atomic_load(&total_requests);
}
```

## When a Mutex Is Still Required

Atomics only cover a single variable's read/modify/write. If you need to update two related fields consistently (e.g., a count and a sum together), you need a mutex (or a lock-free algorithm designed for that specific invariant) — atomics do not compose into a larger atomic transaction automatically.

## See Also

- [conc-mutex-protect-shared-state](conc-mutex-protect-shared-state.md) - When a lock is the right tool instead
- [conc-atomic-memory-order](conc-atomic-memory-order.md) - Choosing the right memory-order argument
- [conc-volatile-not-for-sync](conc-volatile-not-for-sync.md) - Why `volatile` is not a substitute for atomics
