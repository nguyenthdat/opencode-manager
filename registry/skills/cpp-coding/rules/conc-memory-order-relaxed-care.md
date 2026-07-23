# conc-memory-order-relaxed-care

> Default to `seq_cst`; justify weaker orders

## Why It Matters

`std::atomic`'s default memory order is sequential consistency (`std::memory_order_seq_cst`) — the easiest to reason about, since all threads agree on a single global order of atomic operations. Weaker orderings (`acquire`/`release`/`relaxed`) can improve performance on some hardware, but require careful, explicit reasoning about happens-before relationships; using them without a proven need and a documented justification is a common source of extremely subtle, hard-to-reproduce concurrency bugs.

## Bad

```cpp
std::atomic<bool> ready{false};
std::atomic<int> data{0};

void producer() {
    data.store(42, std::memory_order_relaxed);
    ready.store(true, std::memory_order_relaxed);   // No ordering guarantee relative
}                                                      // to the data.store() above!

void consumer() {
    while (!ready.load(std::memory_order_relaxed)) {}
    // relaxed provides NO guarantee that data's write is visible here yet,
    // even though ready is observed true — a real, if rare, bug on real hardware.
    use(data.load(std::memory_order_relaxed));
}
```

## Good — Default to `seq_cst` (No Explicit Order Argument Needed)

```cpp
std::atomic<bool> ready{false};
std::atomic<int> data{0};

void producer() {
    data.store(42);           // seq_cst by default
    ready.store(true);         // seq_cst by default: establishes a happens-before edge
}

void consumer() {
    while (!ready.load()) {}
    use(data.load());          // Guaranteed to see data == 42
}
```

## Good — `acquire`/`release` When Genuinely Needed and Documented

```cpp
// Justified: profiling showed this hot-path flag check benefits measurably
// from release/acquire instead of seq_cst, and the happens-before
// relationship has been reviewed:
void producer() {
    data.store(42, std::memory_order_relaxed);
    ready.store(true, std::memory_order_release);   // Publishes prior writes
}

void consumer() {
    while (!ready.load(std::memory_order_acquire)) {}  // Synchronizes-with the release
    use(data.load(std::memory_order_relaxed));           // Now guaranteed visible
}
```

## See Also

- [conc-atomic-for-simple-state](conc-atomic-for-simple-state.md) - `std::atomic` usage in general
- [conc-avoid-data-races](conc-avoid-data-races.md) - The foundational synchronization requirement
- [lint-thread-sanitizer](lint-thread-sanitizer.md) - Catching ordering bugs at runtime with TSan
