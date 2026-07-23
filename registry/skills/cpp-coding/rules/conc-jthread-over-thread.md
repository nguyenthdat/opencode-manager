# conc-jthread-over-thread

> Prefer `std::jthread` over `std::thread`

## Why It Matters

`std::thread`'s destructor calls `std::terminate` if the thread is still joinable (neither joined nor detached) — a trivially easy mistake, especially with early returns or exceptions. `std::jthread` (C++20) automatically requests a cooperative stop and joins in its destructor, and integrates with `std::stop_token` for clean, structured cancellation.

## Bad

```cpp
void run() {
    std::thread worker([] { do_work(); });

    if (should_abort()) {
        return;   // worker's destructor runs here — still joinable — std::terminate()!
    }
    worker.join();
}
```

## Good

```cpp
void run() {
    std::jthread worker([](std::stop_token stop) {
        while (!stop.stop_requested()) {
            do_work_chunk();
        }
    });

    if (should_abort()) {
        return;   // jthread's destructor requests stop and joins automatically
    }
}   // Joined automatically here too
```

## Cooperative Cancellation With `stop_token`

```cpp
std::jthread worker([](std::stop_token stop) {
    while (!stop.stop_requested()) {
        process_next_item();
    }
    cleanup();
});

worker.request_stop();   // Optional: request early stop explicitly
// Destructor also calls request_stop() + join() automatically if not already done
```

## See Also

- [conc-lock-guard-raii](conc-lock-guard-raii.md) - RAII patterns for the rest of the concurrency toolkit
- [conc-thread-pool-over-raw-threads](conc-thread-pool-over-raw-threads.md) - Avoiding raw threads for task-based work entirely
- [conc-avoid-detach](conc-avoid-detach.md) - Why `detach()` is rarely the right alternative
