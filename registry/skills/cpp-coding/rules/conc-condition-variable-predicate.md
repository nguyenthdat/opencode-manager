# conc-condition-variable-predicate

> Always guard `wait` with a predicate

## Why It Matters

`condition_variable::wait()` can wake up spuriously (return with no corresponding `notify`) or race with a notification that happened just before `wait()` was called. Calling the predicate-less `wait(lock)` and assuming the condition is now true is a bug; always use the predicate overload (or a manual `while` loop) that re-checks the actual condition after waking.

## Bad

```cpp
std::mutex m;
std::condition_variable cv;
bool ready = false;

void consumer() {
    std::unique_lock lock(m);
    cv.wait(lock);           // Spurious wakeup: proceeds even though ready may be false!
    process();                // May process before the data is actually ready
}

void producer() {
    { std::lock_guard lock(m); ready = true; }
    cv.notify_one();
}
```

## Good

```cpp
std::mutex m;
std::condition_variable cv;
bool ready = false;

void consumer() {
    std::unique_lock lock(m);
    cv.wait(lock, [] { return ready; });   // Re-checks the predicate after every wakeup,
    process();                              // including spurious ones
}

void producer() {
    {
        std::lock_guard lock(m);
        ready = true;
    }   // Set the flag BEFORE notifying, and while holding the lock
    cv.notify_one();
}
```

## Timed Waits Need the Same Care

```cpp
bool wait_with_timeout(std::mutex& m, std::condition_variable& cv, bool& ready) {
    std::unique_lock lock(m);
    return cv.wait_for(lock, std::chrono::seconds(5), [&] { return ready; });
    // Returns false if the timeout elapsed with the predicate still false —
    // correctly distinguishes timeout from spurious wakeup.
}
```

## See Also

- [conc-lock-guard-raii](conc-lock-guard-raii.md) - `unique_lock` as required by `condition_variable::wait`
- [conc-avoid-data-races](conc-avoid-data-races.md) - Why `ready` must be set while holding the lock
- [conc-lock-ordering-deadlock](conc-lock-ordering-deadlock.md) - Broader lock-safety considerations
