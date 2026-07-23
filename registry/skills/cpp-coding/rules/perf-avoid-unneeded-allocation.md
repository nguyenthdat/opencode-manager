# perf-avoid-unneeded-allocation

> Avoid unnecessary heap allocation in loops

## Why It Matters

A heap allocation inside a loop body repeats the allocator's bookkeeping cost (and potential lock contention in multi-threaded allocators) on every iteration, when the same buffer could often be allocated once outside the loop and reused. This is one of the most common, easily-fixed sources of avoidable overhead in hot code.

## Bad

```cpp
void process_frames(const std::vector<Frame>& frames) {
    for (const auto& frame : frames) {
        std::vector<Pixel> scratch;         // Allocates fresh storage every iteration
        transform_frame(frame, scratch);
        write_output(scratch);
    }
}
```

## Good

```cpp
void process_frames(const std::vector<Frame>& frames) {
    std::vector<Pixel> scratch;   // Allocated once, outside the loop
    for (const auto& frame : frames) {
        scratch.clear();           // Reuses existing capacity — no reallocation
        transform_frame(frame, scratch);
        write_output(scratch);
    }
}
```

## `clear()` Retains Capacity; `= {}` Does Not

```cpp
std::vector<int> v = {1, 2, 3, 4, 5};
v.clear();       // size() == 0, but capacity() is unchanged — safe to reuse
v = {};           // May release the underlying allocation entirely — avoid in a
                   // loop if you intend to keep reusing the same buffer
```

## Small String Optimization Also Applies

```cpp
// std::string implementations typically avoid heap allocation entirely for
// short strings (SSO) — favor reusing a std::string across iterations the
// same way as shown above for vectors, when strings are built repeatedly.
std::string buffer;
for (const auto& item : items) {
    buffer.clear();
    buffer += item.name;
    process(buffer);
}
```

## See Also

- [perf-reserve-known-size](perf-reserve-known-size.md) - Pre-sizing to avoid reallocation as well as re-allocation
- [conc-thread-local-storage](conc-thread-local-storage.md) - Per-thread reusable scratch buffers
- [perf-string-concatenation](perf-string-concatenation.md) - The string-specific version of this concern
