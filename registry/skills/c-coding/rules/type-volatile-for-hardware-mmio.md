# type-volatile-for-hardware-mmio

> Use `volatile` for memory-mapped hardware registers and signal-handler-shared variables, and understand that it is not a concurrency primitive

## Why It Matters

`volatile` tells the compiler that a value can change through means it cannot see (hardware side effects, a signal handler running asynchronously), so every read and write must actually touch memory rather than being cached in a register or eliminated as "redundant." This is exactly right for memory-mapped I/O and `sig_atomic_t` signal flags — and exactly insufficient for multi-threaded synchronization, which needs `_Atomic` or a mutex instead.

## Bad

```c
/* Without volatile: the compiler may hoist the read out of the loop entirely,
 * assuming *STATUS_REG can't change without code it can see writing to it. */
uint32_t *STATUS_REG = (uint32_t *)0x40001000;
while (!(*STATUS_REG & READY_BIT)) { }   /* may optimize to an infinite loop, or a single check */
```

## Good

```c
volatile uint32_t *const STATUS_REG = (volatile uint32_t *)0x40001000;
while (!(*STATUS_REG & READY_BIT)) { }   /* every iteration performs a real memory read */
```

## Signal Handler Shared State: sig_atomic_t

```c
#include <signal.h>

static volatile sig_atomic_t g_interrupted = 0;

void handle_sigint(int sig) {
    (void)sig;
    g_interrupted = 1;   /* only sig_atomic_t is guaranteed safe to write from a signal handler this way */
}

int main(void) {
    signal(SIGINT, handle_sigint);
    while (!g_interrupted) {
        do_work();
    }
    return 0;
}
```

## What volatile Does NOT Give You

`volatile` provides no atomicity for multi-byte types, and no memory-ordering guarantees relative to other threads' operations — see `conc-volatile-not-for-sync` before reaching for it in multi-threaded code.

## See Also

- [conc-volatile-not-for-sync](conc-volatile-not-for-sync.md) - Why this is not a substitute for atomics/locks
- [conc-atomic-for-flags-counters](conc-atomic-for-flags-counters.md) - The correct tool for inter-thread flags
- [type-const-correctness](type-const-correctness.md) - `const` and `volatile` can be combined (`const volatile`) for read-only hardware registers
