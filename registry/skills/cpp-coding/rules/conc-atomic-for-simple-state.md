# conc-atomic-for-simple-state

> Use `std::atomic` for simple counters/flags

## Why It Matters

For a single, simple piece of state (a counter, a boolean flag, a pointer swap), `std::atomic<T>` provides lock-free, hardware-supported synchronization with lower overhead than a mutex — no OS-level lock/unlock, no risk of blocking, no deadlock potential. Reserve mutexes for protecting multi-step invariants across several related fields.

## Bad

```cpp
class ShutdownFlag {
public:
    void request_shutdown() {
        std::lock_guard lock(mutex_);
        shutdown_ = true;   // A whole mutex just to guard a single bool
    }
    bool is_shutting_down() const {
        std::lock_guard lock(mutex_);
        return shutdown_;
    }
private:
    mutable std::mutex mutex_;
    bool shutdown_ = false;
};
```

## Good

```cpp
class ShutdownFlag {
public:
    void request_shutdown() { shutdown_.store(true, std::memory_order_release); }
    bool is_shutting_down() const { return shutdown_.load(std::memory_order_acquire); }
private:
    std::atomic<bool> shutdown_{false};
};
```

## Compare-and-Swap for Lock-Free Updates

```cpp
std::atomic<int> high_score{0};

void try_update_high_score(int score) {
    int current = high_score.load(std::memory_order_relaxed);
    while (score > current &&
           !high_score.compare_exchange_weak(current, score, std::memory_order_relaxed)) {
        // current is updated with the latest value on each failed attempt; retry
    }
}
```

## Don't Reach for Atomics When Multiple Fields Must Stay Consistent Together

```cpp
// WRONG: updating two atomics "together" still isn't atomic as a pair —
// a reader can observe x updated but y not yet updated.
std::atomic<int> x{0}, y{0};
void update(int nx, int ny) { x = nx; y = ny; }  // Use a mutex instead for this case
```

## See Also

- [conc-avoid-data-races](conc-avoid-data-races.md) - The general synchronization requirement
- [conc-memory-order-relaxed-care](conc-memory-order-relaxed-care.md) - Choosing memory ordering deliberately
- [conc-lock-guard-raii](conc-lock-guard-raii.md) - Mutexes for multi-field invariants
