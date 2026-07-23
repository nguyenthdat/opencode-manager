# perf-profile-before-optimize

> Profile before micro-optimizing

## Why It Matters

Intuition about where a program spends its time is frequently wrong — the actual bottleneck is often in a place no one would guess (an unexpectedly expensive logging call, a cold-path allocation that dominates because it's invoked more often than assumed) while the code that "looks slow" is negligible in practice. Optimizing without measurement risks spending real engineering effort making a rarely-executed piece of code faster while the real hotspot remains untouched.

## Bad

```cpp
// "This loop iterates a lot, so let's hand-optimize it with unsafe raw
// pointer arithmetic and manual SIMD" — done without ever measuring whether
// this loop is even a meaningful fraction of total runtime.
void process(std::vector<float>& data) {
    float* p = data.data();
    size_t n = data.size();
    for (size_t i = 0; i < n; i += 4) {
        // Hand-unrolled, manually vectorized... but maybe this function is
        // called once per program run and contributes 0.01% of total time.
    }
}
```

## Good

```bash
# Measure first, using a real profiler against a representative workload:
perf record -g ./my_program --workload=production_like
perf report

# Or with a sampling profiler / instrumentation:
valgrind --tool=callgrind ./my_program
gprof ./my_program gmon.out

# Or targeted micro-benchmarks for a specific suspected hotspot:
# (Google Benchmark)
```

```cpp
#include <benchmark/benchmark.h>

static void BM_ProcessData(benchmark::State& state) {
    std::vector<float> data(state.range(0));
    for (auto _ : state) {
        process(data);
        benchmark::DoNotOptimize(data);
    }
}
BENCHMARK(BM_ProcessData)->Range(1024, 1 << 20);
```

## Optimize the Measured Hotspot, Then Re-Measure

```cpp
// After profiling identifies the actual bottleneck, apply a targeted fix
// (algorithmic change, allocation reduction, cache-friendly layout), then
// re-profile to confirm the change actually improved the metric that matters.
```

## See Also

- [perf-cache-friendly-soa](perf-cache-friendly-soa.md) - A data-layout optimization worth measuring before/after
- [perf-avoid-virtual-hot-path](perf-avoid-virtual-hot-path.md) - Another optimization that should be profile-justified
- [tmpl-crtp-static-polymorphism](tmpl-crtp-static-polymorphism.md) - A static-dispatch technique worth profile-justifying too
