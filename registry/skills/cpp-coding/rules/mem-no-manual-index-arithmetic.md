# mem-no-manual-index-arithmetic

> Avoid manual pointer/index arithmetic; use algorithms/ranges

## Why It Matters

Hand-written pointer or index arithmetic (`ptr + i`, `begin + offset - 1`) is a frequent source of off-by-one errors and is invisible to the compiler's bounds analysis. Standard algorithms and range-based constructs express the same intent while eliminating an entire class of arithmetic mistakes.

## Bad

```cpp
int find_max(const int* data, size_t n) {
    int max = data[0];
    for (size_t i = 1; i < n; ++i) {
        if (data[i] > max) max = data[i];
    }
    return max;
}

void reverse_copy(int* dst, const int* src, size_t n) {
    for (size_t i = 0; i < n; ++i) {
        dst[i] = src[n - i - 1];   // Easy to get the off-by-one wrong
    }
}
```

## Good

```cpp
#include <algorithm>
#include <span>

int find_max(std::span<const int> data) {
    return *std::max_element(data.begin(), data.end());
}

void reverse_copy(std::span<int> dst, std::span<const int> src) {
    std::copy(src.rbegin(), src.rend(), dst.begin());
}
```

## Ranges (C++20) Make Intent Even Clearer

```cpp
#include <ranges>

auto evens = data | std::views::filter([](int v) { return v % 2 == 0; });
auto squared = evens | std::views::transform([](int v) { return v * v; });

for (int v : squared) {
    process(v);   // No index/pointer arithmetic anywhere
}
```

## See Also

- [perf-algorithm-over-handwritten-loop](perf-algorithm-over-handwritten-loop.md) - The performance/clarity case for algorithms
- [mem-span-bounds](mem-span-bounds.md) - `std::span` in place of pointer+length
- [mem-iterator-invalidation](mem-iterator-invalidation.md) - Iterator-based safety concerns
