# doc-thread-safety-contract

> Document thread-safety guarantees

## Why It Matters

Whether a class or function can be safely called from multiple threads concurrently, or requires external synchronization, is invisible from its signature alone. Documenting the thread-safety contract explicitly (per class, or per method if it varies) prevents callers from either unnecessarily over-synchronizing or dangerously under-synchronizing.

## Bad

```cpp
class Cache {
public:
    void put(const std::string& key, std::string value);
    std::optional<std::string> get(const std::string& key) const;
    // Is this safe to call from multiple threads? Undocumented — callers
    // must read the implementation (which itself may change over time).
};
```

## Good

```cpp
/// A key-value cache.
///
/// \threadsafety This class is thread-safe: put() and get() may be called
/// concurrently from multiple threads without external synchronization.
/// Iteration (if added in the future) is NOT covered by this guarantee
/// unless explicitly documented on that method.
class Cache {
public:
    void put(const std::string& key, std::string value);
    std::optional<std::string> get(const std::string& key) const;
};

/// A single-threaded event queue.
///
/// \threadsafety This class is NOT thread-safe. All methods must be called
/// from the same thread that constructed the instance.
class EventQueue {
public:
    void push(Event event);
    std::optional<Event> pop();
};
```

## Document Const-Method Exceptions Too

```cpp
/// \threadsafety const methods are safe for concurrent calls from multiple
/// threads. Non-const methods require exclusive access (no concurrent calls
/// to any method, const or non-const, on the same instance).
class ReadMostlyConfig { /* ... */ };
```

## See Also

- [conc-avoid-data-races](conc-avoid-data-races.md) - The synchronization requirement being documented
- [doc-ownership-contract](doc-ownership-contract.md) - The analogous ownership/lifetime documentation practice
- [conc-shared-mutex-readers](conc-shared-mutex-readers.md) - Implementing the read-mostly guarantee shown above
