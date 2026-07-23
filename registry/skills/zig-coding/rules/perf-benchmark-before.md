# perf-benchmark-before

> Profile and benchmark before applying any of the other performance rules in this category

## Why It Matters

Every technique in this category — struct-of-arrays, SIMD, comptime lookup tables, capacity pre-sizing — trades code simplicity for speed. That trade is only worth making where a profiler has shown the code actually matters; applying it everywhere "just in case" adds complexity and maintenance cost to code that was never actually slow, and can even make performance worse by fighting the optimizer's own heuristics or hurting cache behavior elsewhere.

## Bad

```zig
const std = @import("std");

// Reaching for @Vector, packed structs, and manual capacity tuning on a
// function that runs three times at startup and was never measured.
fn loadStartupConfig(allocator: std.mem.Allocator) !Config {
    var list = std.ArrayList(u8).init(allocator);
    try list.ensureTotalCapacityPrecise(4096); // premature: this runs once
    _ = &list;
    return Config{};
}

const Config = struct {};
```

## Good

```zig
const std = @import("std");

// Simple, obviously correct code for a cold path.
fn loadStartupConfig(allocator: std.mem.Allocator) !Config {
    _ = allocator;
    return Config{};
}

const Config = struct {};

// Reserve the tuned, complex version for code a benchmark has actually
// flagged as hot — e.g. via `zig build bench` or a dedicated benchmark
// harness measuring wall-clock time across representative input sizes.
```

## What to Measure First

- Wall-clock time under representative, realistic input sizes — not a microbenchmark of an isolated snippet that the optimizer might handle differently in context.
- Allocation counts (a leak-detecting allocator can also report allocation counts, useful as a rough proxy for allocator pressure).
- Whether the "hot" code is actually where time is spent, via a sampling profiler (`perf`, `Instruments`, `valgrind --tool=callgrind`), not intuition.

## See Also

- [perf-avoid-alloc-hot-path](perf-avoid-alloc-hot-path.md) - one of the techniques this rule gates
- [perf-vector-simd](perf-vector-simd.md) - another technique that should follow, not precede, profiling
- [anti-premature-optimize](../rust-coding/rules/anti-premature-optimize.md) - the analogous Rust anti-pattern, for comparison
