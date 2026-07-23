# conc-atomic-memory-order

> Choose the weakest memory order that is still correct for each atomic operation, and default to `memory_order_seq_cst` when unsure

## Why It Matters

C11 atomics let you specify a memory ordering (`relaxed`, `acquire`, `release`, `acq_rel`, `seq_cst`) that controls what reordering the compiler/CPU may perform around the atomic operation. Using `relaxed` when you actually need `acquire`/`release` semantics can let a genuine data-race-shaped bug slip through even though the individual variable access is technically atomic (no torn reads) — the ordering, not just the atomicity, is what makes cross-thread handoffs of other data correct.

## Bad

```c
#include <stdatomic.h>

static atomic_int ready = 0;
static int payload;

void producer(void) {
    payload = compute();
    atomic_store_explicit(&ready, 1, memory_order_relaxed);  /* no ordering guarantee: payload write may be reordered after this */
}

void consumer(void) {
    while (!atomic_load_explicit(&ready, memory_order_relaxed)) { }  /* may observe ready==1 before payload write is visible */
    use(payload);   /* possible data race on payload despite ready being atomic */
}
```

## Good

```c
#include <stdatomic.h>

static atomic_int ready = 0;
static int payload;

void producer(void) {
    payload = compute();
    atomic_store_explicit(&ready, 1, memory_order_release);  /* publishes payload write */
}

void consumer(void) {
    while (!atomic_load_explicit(&ready, memory_order_acquire)) { }  /* synchronizes-with the release */
    use(payload);   /* payload write is guaranteed visible now */
}
```

## Guidance

| Situation | Ordering |
|-----------|----------|
| Simple independent counter (stats, not gating other data) | `memory_order_relaxed` |
| Publishing data to be consumed after a flag/store | `memory_order_release` (store) / `memory_order_acquire` (load) |
| Not sure, or reasoning is getting complex | `memory_order_seq_cst` (default, easiest to reason about, use `atomic_store`/`atomic_load` plain forms) |

Reach for `relaxed`/`acquire`/`release` only after profiling shows `seq_cst` atomics are a bottleneck, and get the reasoning reviewed — subtle memory-ordering bugs are among the hardest concurrency bugs to reproduce.

## See Also

- [conc-atomic-for-flags-counters](conc-atomic-for-flags-counters.md) - Basic atomic usage this rule refines
- [conc-volatile-not-for-sync](conc-volatile-not-for-sync.md) - Why `volatile` cannot substitute for this
- [lint-thread-sanitizer](lint-thread-sanitizer.md) - Detecting ordering-related races empirically
