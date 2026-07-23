# conc-avoid-data-races

> Guard every piece of shared mutable state

## Why It Matters

A data race — two threads accessing the same memory location concurrently, at least one a write, with no synchronization — is undefined behavior in C++, not merely "unpredictable output." The compiler is permitted to assume data races don't happen and optimize accordingly, meaning a race can manifest as anything from a wrong value to a crash to seemingly unrelated misbehavior elsewhere in the program.

## Bad

```cpp
class Stats {
public:
    void record(int value) {
        total_ += value;   // No synchronization: data race if called from multiple threads
        ++count_;
    }
    double average() const { return static_cast<double>(total_) / count_; }
private:
    long total_ = 0;
    int count_ = 0;
};

// Two threads calling stats.record() concurrently: undefined behavior,
// not just "might get a slightly wrong average."
```

## Good — Mutex Protection

```cpp
class Stats {
public:
    void record(int value) {
        std::lock_guard lock(mutex_);
        total_ += value;
        ++count_;
    }
    double average() const {
        std::lock_guard lock(mutex_);
        return static_cast<double>(total_) / count_;
    }
private:
    mutable std::mutex mutex_;
    long total_ = 0;
    int count_ = 0;
};
```

## Good — Atomics for Simple State

```cpp
class Stats {
public:
    void record(int value) {
        total_.fetch_add(value, std::memory_order_relaxed);
        count_.fetch_add(1, std::memory_order_relaxed);
    }
private:
    std::atomic<long> total_{0};
    std::atomic<int> count_{0};
};
```

## See Also

- [conc-atomic-for-simple-state](conc-atomic-for-simple-state.md) - `std::atomic` in depth
- [conc-lock-guard-raii](conc-lock-guard-raii.md) - RAII locking to protect critical sections
- [lint-thread-sanitizer](lint-thread-sanitizer.md) - Detecting data races at runtime with TSan
