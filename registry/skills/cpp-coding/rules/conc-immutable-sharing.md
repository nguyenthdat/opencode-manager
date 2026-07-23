# conc-immutable-sharing

> Prefer sharing immutable data over synchronizing mutable data

## Why It Matters

Immutable data can be freely read by any number of threads with zero synchronization, because there is no write to race against. Reaching for immutability first — build a value once, then share it read-only — often eliminates the need for a mutex or atomic entirely, which is both simpler and faster than any synchronization scheme.

## Bad

```cpp
class SharedConfig {
public:
    void update(Config new_config) {
        std::lock_guard lock(mutex_);
        config_ = std::move(new_config);
    }
    Config get() const {
        std::lock_guard lock(mutex_);
        return config_;   // Copies under lock every read, even though reads
    }                       // vastly outnumber updates and don't need to race
private:
    mutable std::mutex mutex_;
    Config config_;
};
```

## Good — Immutable Snapshots Shared via `shared_ptr`

```cpp
class SharedConfig {
public:
    void update(Config new_config) {
        auto snapshot = std::make_shared<const Config>(std::move(new_config));
        std::atomic_store(&current_, snapshot);   // Atomic pointer swap: fast, no lock
    }

    std::shared_ptr<const Config> get() const {
        return std::atomic_load(&current_);   // Readers get an immutable snapshot;
    }                                            // no synchronization needed to read it
private:
    std::shared_ptr<const Config> current_ = std::make_shared<const Config>();
};

// A reader that holds onto its snapshot is guaranteed a consistent, never-
// changing view, even while update() swaps in a newer one concurrently.
auto config = shared.get();
use(config->timeout);   // Safe: this Config object is never mutated after creation
```

## See Also

- [conc-atomic-for-simple-state](conc-atomic-for-simple-state.md) - Atomic pointer swaps for this pattern
- [own-shared-ptr-shared](own-shared-ptr-shared.md) - `shared_ptr` for genuinely shared ownership
- [conc-avoid-data-races](conc-avoid-data-races.md) - Why mutable shared state needs protection at all
