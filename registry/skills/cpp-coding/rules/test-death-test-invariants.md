# test-death-test-invariants

> Use death tests to verify invariant enforcement

## Why It Matters

Code that relies on `assert()` or deliberately calls `std::abort()`/`std::terminate()` to enforce an invariant needs a way to test that the invariant check actually fires when violated — a normal `EXPECT_THROW` can't observe a process abort. GoogleTest's `EXPECT_DEATH` runs the code in a subprocess and verifies it terminates as expected, letting you test the "this should never happen" paths too.

## Bad

```cpp
// No test at all verifies that pop_front() on an empty queue actually
// triggers its assert() — a future refactor could silently remove the
// check, and no test would catch the regression.
size_t pop_front(std::vector<int>& queue) {
    assert(!queue.empty() && "pop_front on empty queue is a caller bug");
    // ...
}
```

## Good

```cpp
TEST(QueueTest, PopFrontOnEmptyQueueAborts) {
    std::vector<int> empty_queue;
    EXPECT_DEATH(pop_front(empty_queue), "pop_front on empty queue is a caller bug");
}

TEST(QueueTest, PopFrontOnNonEmptyQueueSucceeds) {
    std::vector<int> queue = {1, 2, 3};
    EXPECT_EQ(pop_front(queue), 1);   // Normal path still verified separately
}
```

## Death Tests Only Run in Debug Builds (Where `assert` Is Active)

```cpp
// assert() compiles to nothing when NDEBUG is defined (typical release
// builds) — death tests targeting assert() failures should run as part
// of the debug-build test configuration, not the release one.
```

## Caution: Death Tests Are Slower and Have Platform Caveats

```cpp
// GoogleTest documents platform-specific behavior (e.g. threading
// interactions) for death tests — keep them focused on genuinely
// invariant-violating scenarios, not general-purpose testing.
```

## See Also

- [err-assert-vs-exception](err-assert-vs-exception.md) - When `assert()` vs. exceptions is the right choice
- [test-gtest-fixtures](test-gtest-fixtures.md) - Standard (non-death) test structuring
- [mem-sanitizer-required](mem-sanitizer-required.md) - Sanitizers as a complementary invariant-violation detector
