# conc-lock-guard-raii

> Always guard mutexes with RAII lock types

## Why It Matters

A mutex locked manually via `.lock()`/`.unlock()` stays locked across every early return, thrown exception, or forgotten unlock call between them — a guaranteed deadlock for any other thread waiting on it. `lock_guard`/`scoped_lock`/`unique_lock` guarantee the mutex unlocks when the guard goes out of scope, on every exit path.

## Bad

```cpp
class Counter {
public:
    void increment() {
        mutex_.lock();
        ++value_;
        if (value_ > limit_) {
            return;          // Mutex never unlocked — every other thread deadlocks
        }
        mutex_.unlock();
    }
private:
    std::mutex mutex_;
    int value_ = 0;
    int limit_ = 1000;
};
```

## Good

```cpp
class Counter {
public:
    void increment() {
        std::lock_guard lock(mutex_);   // CTAD, C++17
        ++value_;
        if (value_ > limit_) {
            return;   // lock's destructor unlocks automatically
        }
    }
private:
    std::mutex mutex_;
    int value_ = 0;
    int limit_ = 1000;
};
```

## `scoped_lock` for Multiple Mutexes (Deadlock-Free)

```cpp
void transfer(Account& from, Account& to, int amount) {
    std::scoped_lock lock(from.mutex, to.mutex);   // Locks both atomically
    from.balance -= amount;
    to.balance += amount;
}
```

## See Also

- [raii-lock-guard](raii-lock-guard.md) - The same principle, framed as a general RAII rule
- [conc-lock-ordering-deadlock](conc-lock-ordering-deadlock.md) - Avoiding deadlock with multiple locks
- [conc-condition-variable-predicate](conc-condition-variable-predicate.md) - `unique_lock` usage with condition variables
