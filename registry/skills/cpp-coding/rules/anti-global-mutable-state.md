# anti-global-mutable-state

> Don't rely on mutable global/static state

## Why It Matters

Global mutable state creates hidden coupling between unrelated parts of a program (any function can read or modify it, with no signature indicating this dependency), makes unit testing require careful reset/isolation logic to avoid cross-test contamination, and is unsafe to access from multiple threads without explicit, easy-to-forget synchronization.

## Bad

```cpp
int g_request_counter = 0;   // Global mutable state

void handle_request() {
    ++g_request_counter;   // Hidden dependency: not visible in the function signature,
                             // not thread-safe, and impossible to isolate between tests
}
```

## Good

```cpp
class RequestCounter {
public:
    void increment() { count_.fetch_add(1, std::memory_order_relaxed); }
    int count() const { return count_.load(std::memory_order_relaxed); }
private:
    std::atomic<int> count_{0};
};

void handle_request(RequestCounter& counter) {   // Explicit dependency, injectable in tests
    counter.increment();
}
```

## See Also

- [test-no-shared-mutable-fixture](test-no-shared-mutable-fixture.md) - The testing-specific version of this problem
- [conc-avoid-data-races](conc-avoid-data-races.md) - Synchronization requirements for any shared mutable state
- [test-gmock-interfaces](test-gmock-interfaces.md) - Dependency injection as the general alternative to globals
