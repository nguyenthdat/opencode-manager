# perf-algorithm-over-handwritten-loop

> Prefer `<algorithm>`/`<ranges>` over hand-written loops

## Why It Matters

Standard algorithms express intent directly (`std::ranges::sort`, `std::accumulate`, `std::ranges::any_of`) instead of the mechanics of a loop, are well-tested for edge cases (empty ranges, single elements), and are frequently at least as fast as a hand-written equivalent — sometimes faster, since implementations can use specialized, well-tuned code paths (e.g. introsort, SIMD-friendly accumulation) that a typical hand-written loop won't replicate.

## Bad

```cpp
bool any_negative = false;
for (size_t i = 0; i < values.size(); ++i) {
    if (values[i] < 0) {
        any_negative = true;
        break;
    }
}

int sum = 0;
for (size_t i = 0; i < values.size(); ++i) {
    sum += values[i];
}

std::sort(values.begin(), values.end());   // At least this part already uses <algorithm>
```

## Good

```cpp
#include <algorithm>
#include <numeric>
#include <ranges>

bool any_negative = std::ranges::any_of(values, [](int v) { return v < 0; });

int sum = std::accumulate(values.begin(), values.end(), 0);
// Or, C++20 ranges-based:
int sum2 = std::ranges::fold_left(values, 0, std::plus<>{});

std::ranges::sort(values);   // No need to pass .begin()/.end() separately
```

## Composable Pipelines With Ranges (C++20)

```cpp
auto positive_squares = values
    | std::views::filter([](int v) { return v > 0; })
    | std::views::transform([](int v) { return v * v; });

for (int v : positive_squares) {
    process(v);   // Lazily evaluated; no intermediate container allocated
}
```

## When a Hand-Written Loop Is Still Appropriate

```cpp
// Genuinely unusual control flow (multiple related outputs computed in one
// pass, complex early-exit conditions spanning several variables) may be
// clearer as an explicit loop than as a contorted algorithm composition —
// don't force an algorithm where it hurts readability.
```

## See Also

- [mem-no-manual-index-arithmetic](mem-no-manual-index-arithmetic.md) - Eliminating manual indexing errors
- [mem-iterator-invalidation](mem-iterator-invalidation.md) - Iterator safety that algorithms handle correctly
- [perf-cache-friendly-soa](perf-cache-friendly-soa.md) - Data layout that pairs well with algorithm-based access
