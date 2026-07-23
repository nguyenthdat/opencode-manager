# perf-profile-before-optimize

> Profile with real workloads before optimizing anything; intuition about where time is spent in C code is frequently wrong

## Why It Matters

Optimizing code that isn't actually a bottleneck wastes engineering time, adds complexity and bug surface (manual loop unrolling, `restrict`, inlining hints all carry a correctness/maintainability cost), and can even make the real bottleneck harder to see. A profiler measures where time is actually spent, which is very often not where a code reader would guess.

## Bad

```c
/* "This string formatting function looks slow, let me hand-optimize it"
 * — done without ever measuring, on a hunch, possibly optimizing code that
 * accounts for 0.1% of total runtime while the real bottleneck (a network
 * round-trip, or an O(n^2) algorithm elsewhere) goes untouched. */
```

## Good

```sh
# Sampling profiler: identifies the actual hot functions under real load
perf record -g ./my_program < realistic_workload.txt
perf report

# Or, on macOS, use Instruments' Time Profiler; on any platform, gprof/valgrind --tool=callgrind
valgrind --tool=callgrind ./my_program
callgrind_annotate callgrind.out.<pid>
```

## A Simple Workflow

1. Define a realistic benchmark/workload that represents production usage, not a synthetic microbenchmark alone.
2. Profile it and identify the top few functions by cumulative time (not just self time — a function may be cheap per-call but called enormously often).
3. Optimize only those, and re-profile after each change to confirm the expected improvement actually happened.
4. Stop once further optimization no longer moves the metric that matters (latency, throughput) — don't chase diminishing returns on already-fast code.

## See Also

- [perf-cache-friendly-struct-layout](perf-cache-friendly-struct-layout.md) - A real optimization to apply once profiling justifies it
- [perf-restrict-optimizer-hint](perf-restrict-optimizer-hint.md) - An optimization worth applying only after profiling justifies it
- [test-coverage-gcov](test-coverage-gcov.md) - A related "measure before you act" discipline for test suites
