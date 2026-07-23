# err-assert-vs-exception

> `assert()` for programmer errors, exceptions for runtime errors

## Why It Matters

`assert()` documents and checks invariants that should be *impossible* if the program is correct — violating one means a bug in the code itself, not a normal runtime condition. It compiles to nothing in release builds (`NDEBUG`), so it must never be used to validate untrusted input or handle conditions that can legitimately occur in production. Exceptions (or `std::expected`) are for conditions the program must handle even when correct — bad user input, network failures, missing files.

## Bad

```cpp
void set_volume(int percent) {
    assert(percent >= 0 && percent <= 100);   // WRONG: this can come from user
                                                // input/config/network — a real,
                                                // expected failure mode, not a bug.
    volume_ = percent;
}
// In release builds (NDEBUG defined), the assert is compiled out entirely,
// so out-of-range values silently corrupt volume_ with no check at all.
```

## Good

```cpp
void set_volume(int percent) {
    if (percent < 0 || percent > 100) {
        throw std::out_of_range("volume must be 0-100, got " + std::to_string(percent));
    }
    volume_ = percent;
}

// Reserve assert() for invariants the caller cannot violate through normal use:
size_t pop_front(std::vector<int>& queue) {
    assert(!queue.empty() && "pop_front on empty queue is a caller bug");
    int front = queue.front();
    queue.erase(queue.begin());
    return front;
}
```

## Decision Guide

| Condition | Use |
|---|---|
| Can be triggered by user input, config, network, files | Exception / `std::expected` |
| Can only happen if the calling code itself has a bug | `assert()` |
| Must be checked even in release/production builds | Exception, never `assert()` |

## See Also

- [err-exceptions-vs-expected](err-exceptions-vs-expected.md) - Choosing exceptions vs `expected` for real failures
- [raii-avoid-two-phase-init](raii-avoid-two-phase-init.md) - Validating construction arguments explicitly
- [test-death-test-invariants](test-death-test-invariants.md) - Testing that assertions actually fire in debug builds
