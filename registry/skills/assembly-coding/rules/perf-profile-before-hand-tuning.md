# perf-profile-before-hand-tuning

> Profile with a real tool (perf, VTune, Instruments) to confirm a routine is actually hot before spending effort hand-tuning its asm

## Why It Matters

Hand-tuning assembly is expensive in engineer time and maintenance risk (every micro-optimization is a chance to introduce a subtle bug); spending that effort on a routine that isn't actually a measurable bottleneck is pure cost with no benefit. Profiling first ensures the effort goes where it can actually move the needle, and provides the before/after numbers needed to confirm the optimization was worth keeping.

## Bad (Optimizing by Guesswork)

```
# "This loop looks like it could be slow, let me rewrite it in hand-tuned SIMD asm..."
# ...three days later, a benchmark shows the "optimized" routine accounts for 0.3% of runtime.
```

## Good

```bash
# Linux perf - identify where time is actually being spent first
perf record -g ./my_program
perf report                 # shows the hottest functions by sampled time

# Zoom into a specific function's instruction-level hotspots
perf annotate compute_checksum
```

```bash
# macOS - Instruments' Time Profiler serves the same purpose
xcrun xctrace record --template 'Time Profiler' --launch -- ./my_program
```

## Confirming the Optimization Actually Helped

```bash
# Benchmark before and after with a proper microbenchmark harness, not a single manual timing run
hyperfine './my_program_before' './my_program_after'
```

```c
/* Or a dedicated in-process benchmark using a library with warm-up and statistical rigor */
#include <benchmark/benchmark.h>
static void BM_ComputeChecksum(benchmark::State& state) {
    for (auto _ : state) {
        compute_checksum(data, len);
    }
}
BENCHMARK(BM_ComputeChecksum);
```

## What "Hot" Actually Means

A function worth hand-optimizing typically shows up as a meaningful percentage of total sampled time (context-dependent, but often 5%+ for it to be worth the engineering cost) across realistic workloads — not synthetic microbenchmarks that don't represent real usage patterns.

## See Also

- [anti-premature-hand-optimization](anti-premature-hand-optimization.md) - The assembly-specific anti-pattern this rule prevents
- [test-golden-file-disasm](test-golden-file-disasm.md) - Tracking codegen changes once you've committed to an optimization
- [ctrl-avoid-mispredict-hot-loop](ctrl-avoid-mispredict-hot-loop.md) - An optimization worth confirming is actually needed first
