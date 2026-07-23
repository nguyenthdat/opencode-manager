# conc-volatile-not-for-sync

> Do not use `volatile` for thread synchronization; it prevents compiler caching but provides no atomicity or memory ordering

## Why It Matters

`volatile` tells the compiler "this value can change for reasons the compiler can't see" (useful for memory-mapped hardware registers or signal handlers), but it says nothing about atomicity, and nothing about the memory ordering visible to other threads. A `volatile int` can still be read and written non-atomically (torn on some architectures/widths) and its updates are not guaranteed to become visible to other cores in any particular order — `volatile` is not a substitute for `_Atomic` or a mutex.

## Bad

```c
static volatile int ready = 0;   /* looks synchronized, isn't */

void *producer(void *arg) {
    prepare_data();
    ready = 1;                     /* no memory barrier: other threads may see stale `prepare_data` effects */
    return NULL;
}

void *consumer(void *arg) {
    while (!ready) { }               /* volatile only stops the compiler from caching `ready` in a register;
                                       * it does not order this read relative to producer's writes on all architectures */
    use(shared_data);                 /* may observe incomplete prepare_data() effects */
    return NULL;
}
```

## Good

```c
#include <stdatomic.h>

static atomic_int ready = 0;

void *producer(void *arg) {
    prepare_data();
    atomic_store_explicit(&ready, 1, memory_order_release);   /* publishes prior writes */
    return NULL;
}

void *consumer(void *arg) {
    while (!atomic_load_explicit(&ready, memory_order_acquire)) { }  /* synchronizes-with the release store */
    use(shared_data);                                                  /* prepare_data()'s effects are now visible */
    return NULL;
}
```

## When volatile Is the Right Tool

```c
/* Memory-mapped hardware register: reads/writes must not be optimized away
 * or reordered by the compiler, even though there's no "other thread" involved. */
volatile uint32_t *const UART_STATUS = (uint32_t *)0x4000);
while (!(*UART_STATUS & READY_BIT)) { }   /* legitimate volatile use case */
```

## See Also

- [conc-atomic-for-flags-counters](conc-atomic-for-flags-counters.md) - The correct tool for inter-thread flags
- [conc-atomic-memory-order](conc-atomic-memory-order.md) - Choosing acquire/release/seq_cst correctly
- [type-volatile-for-hardware-mmio](type-volatile-for-hardware-mmio.md) - `volatile`'s legitimate use case
