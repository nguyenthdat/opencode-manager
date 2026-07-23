# perf-reserve-known-size

> Call `reserve()` when final size is known

## Why It Matters

`std::vector`'s growth strategy reallocates and copies/moves every existing element each time capacity is exceeded — typically doubling capacity, so a vector grown one element at a time from empty to N elements performs O(log N) reallocations, each copying/moving progressively more elements. Calling `reserve(n)` up front when the final size is known (or estimable) eliminates all of that reallocation entirely.

## Bad

```cpp
std::vector<int> squares;
for (int i = 0; i < 1'000'000; ++i) {
    squares.push_back(i * i);   // Reallocates ~20 times as capacity doubles,
}                                  // copying/moving all prior elements each time
```

## Good

```cpp
std::vector<int> squares;
squares.reserve(1'000'000);   // One allocation, upfront — no reallocation during the loop
for (int i = 0; i < 1'000'000; ++i) {
    squares.push_back(i * i);
}
```

## Applies to Strings Too

```cpp
std::string build_csv_line(const std::vector<int>& values) {
    std::string line;
    line.reserve(values.size() * 4);   // Rough estimate: avoids repeated reallocation
    for (int v : values) {
        line += std::to_string(v);
        line += ',';
    }
    return line;
}
```

## Don't Over-Reserve

```cpp
// Reserving far more than will actually be used wastes memory for no
// benefit — reserve() is for a KNOWN or well-estimated final size, not a
// defensive worst-case guess:
squares.reserve(1'000'000'000);   // Wasteful if only ~1,000,000 elements are ever added
```

## See Also

- [mem-vector-over-manual](mem-vector-over-manual.md) - `std::vector`'s growth behavior in general
- [perf-emplace-over-push](perf-emplace-over-push.md) - Reducing per-element construction cost too
- [perf-avoid-unneeded-allocation](perf-avoid-unneeded-allocation.md) - The broader allocation-minimization principle
