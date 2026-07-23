# conc-thread-local-storage

> Use `thread_local` for per-thread state

## Why It Matters

When each thread needs its own independent instance of some state (a scratch buffer, a random number generator, a per-thread cache) that should never be shared or synchronized, `thread_local` gives each thread its own copy automatically, with no manual indexing-by-thread-id bookkeeping and no synchronization overhead.

## Bad

```cpp
std::mutex rng_mutex;
std::mt19937 shared_rng;   // Synchronizing a per-call random number generator
                             // across threads serializes every call unnecessarily,
                             // and reduces the actual quality of parallel randomness.

int random_value() {
    std::lock_guard lock(rng_mutex);
    return shared_rng();
}
```

## Good

```cpp
int random_value() {
    thread_local std::mt19937 rng(std::random_device{}());   // Each thread gets
    return rng();                                              // its own independent
}                                                                // generator, no locking
```

## Per-Thread Scratch Buffers

```cpp
void process_chunk(std::span<const std::byte> input) {
    thread_local std::vector<std::byte> scratch;   // Reused across calls on
    scratch.clear();                                 // this thread, no reallocation,
    scratch.reserve(input.size());                    // and never contended by other threads
    transform(input, scratch);
}
```

## Caveats

`thread_local` variables with non-trivial constructors/destructors have per-thread initialization cost on first access and cleanup cost on thread exit — measure if this matters in a hot path with many short-lived threads, and prefer a thread pool (long-lived threads) to amortize it.

## See Also

- [conc-atomic-for-simple-state](conc-atomic-for-simple-state.md) - Alternative when state is genuinely shared, not per-thread
- [conc-thread-pool-over-raw-threads](conc-thread-pool-over-raw-threads.md) - Long-lived threads amortize thread_local init cost
- [perf-avoid-unneeded-allocation](perf-avoid-unneeded-allocation.md) - Reusing scratch buffers for performance
