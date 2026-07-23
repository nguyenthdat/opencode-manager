# raii-lock-guard

> Use `lock_guard`/`scoped_lock`, never manual lock/unlock

## Why It Matters

Manual `mutex::lock()`/`unlock()` pairs leak locked mutexes on every early return or thrown exception between them, causing deadlocks elsewhere in the program. RAII lock types release the mutex automatically on any exit path.

## Bad

```cpp
std::mutex m;
int shared_counter = 0;

void increment() {
    m.lock();
    ++shared_counter;
    if (shared_counter > 1000) {
        return;          // Mutex stays locked forever — deadlock!
    }
    do_work();           // If this throws, mutex also stays locked
    m.unlock();
}
```

## Good

```cpp
std::mutex m;
int shared_counter = 0;

void increment() {
    std::lock_guard lock(m);   // CTAD, C++17
    ++shared_counter;
    if (shared_counter > 1000) {
        return;                 // Mutex released automatically
    }
    do_work();                  // Released even if this throws
}
```

## Locking Multiple Mutexes Without Deadlock

```cpp
std::mutex a, b;

void transfer() {
    std::scoped_lock lock(a, b);  // Locks both atomically, deadlock-free order
    // ... critical section touching both resources ...
}
```

## unique_lock When You Need Flexibility

```cpp
void wait_for_data(std::mutex& m, std::condition_variable& cv, bool& ready) {
    std::unique_lock lock(m);      // Can be unlocked/relocked, needed by wait()
    cv.wait(lock, [&] { return ready; });
    // ... use protected data ...
}   // Unlocked automatically at scope exit
```

## See Also

- [conc-lock-guard-raii](conc-lock-guard-raii.md) - Broader concurrency guidance on RAII locking
- [conc-lock-ordering-deadlock](conc-lock-ordering-deadlock.md) - Avoiding deadlock with multiple locks
- [conc-condition-variable-predicate](conc-condition-variable-predicate.md) - `unique_lock` with `condition_variable`
