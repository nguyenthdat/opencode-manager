# conc-shared-mutex-readers

> Use `std::shared_mutex` when reads dominate

## Why It Matters

A regular `std::mutex` allows only one thread in at a time, even for read-only access, which serializes readers unnecessarily when writes are rare. `std::shared_mutex` (C++17) lets multiple readers hold a shared lock concurrently, while writers still get exclusive access — improving throughput for read-heavy workloads.

## Bad

```cpp
class Config {
public:
    std::string get(const std::string& key) const {
        std::lock_guard lock(mutex_);   // Serializes ALL readers, even though
        return data_.at(key);            // reads never conflict with each other
    }
    void set(const std::string& key, std::string value) {
        std::lock_guard lock(mutex_);
        data_[key] = std::move(value);
    }
private:
    mutable std::mutex mutex_;
    std::unordered_map<std::string, std::string> data_;
};
```

## Good

```cpp
#include <shared_mutex>

class Config {
public:
    std::string get(const std::string& key) const {
        std::shared_lock lock(mutex_);   // Multiple readers can hold this concurrently
        return data_.at(key);
    }
    void set(const std::string& key, std::string value) {
        std::unique_lock lock(mutex_);   // Exclusive: blocks readers and other writers
        data_[key] = std::move(value);
    }
private:
    mutable std::shared_mutex mutex_;
    std::unordered_map<std::string, std::string> data_;
};
```

## When Not to Bother

```cpp
// If reads and writes happen at roughly similar frequency, or the critical
// section is very short, shared_mutex's extra bookkeeping can make it
// slower than a plain mutex. Measure before switching; this is a read-heavy
// workload optimization specifically, not a universal upgrade.
```

## See Also

- [conc-lock-guard-raii](conc-lock-guard-raii.md) - RAII locking in general
- [conc-avoid-data-races](conc-avoid-data-races.md) - The synchronization requirement this satisfies
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Verifying this is actually the bottleneck first
