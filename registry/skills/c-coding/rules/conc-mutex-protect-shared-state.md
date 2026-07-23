# conc-mutex-protect-shared-state

> Guard every piece of mutable state shared across threads with a mutex (or another synchronization primitive), no exceptions

## Why It Matters

Concurrent unsynchronized access to the same memory location, where at least one access is a write, is a data race — undefined behavior in C11's memory model, not merely "might give a stale value." Compilers are entitled to assume data-race-free code and may reorder or cache accesses in ways that turn a suspected race into a genuine crash or corruption.

## Bad

```c
static int counter = 0;

void *worker(void *arg) {
    for (int i = 0; i < 1000; i++) {
        counter++;    /* unsynchronized read-modify-write from multiple threads: data race */
    }
    return NULL;
}
```

## Good

```c
#include <pthread.h>

static int counter = 0;
static pthread_mutex_t counter_lock = PTHREAD_MUTEX_INITIALIZER;

void *worker(void *arg) {
    for (int i = 0; i < 1000; i++) {
        pthread_mutex_lock(&counter_lock);
        counter++;
        pthread_mutex_unlock(&counter_lock);
    }
    return NULL;
}
```

## Keep Critical Sections Small

```c
pthread_mutex_lock(&lock);
int snapshot = shared_value;      /* only the shared read is inside the lock */
pthread_mutex_unlock(&lock);

int result = expensive_computation(snapshot);   /* done outside the lock */
```

## See Also

- [conc-atomic-for-flags-counters](conc-atomic-for-flags-counters.md) - Lock-free alternative for simple counters/flags
- [conc-avoid-deadlock-lock-ordering](conc-avoid-deadlock-lock-ordering.md) - Avoiding deadlock when multiple locks are needed
- [conc-avoid-data-races](conc-avoid-data-races.md) - The general data-race hazard this rule prevents
