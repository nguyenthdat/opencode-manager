# perf-vector-simd

> Use `@Vector` for data-parallel numeric operations the compiler can map to SIMD instructions

## Why It Matters

`@Vector(N, T)` is a first-class Zig type representing `N` lanes of `T`, with arithmetic operators (`+`, `*`, comparisons) applying element-wise across all lanes in a single operation. The compiler lowers this to real SIMD instructions on supported targets, giving a meaningful throughput win for numeric workloads (image processing, audio, physics) over an element-by-element scalar loop — without hand-written target-specific intrinsics.

## Bad

```zig
const std = @import("std");

fn addArrays(a: []const f32, b: []const f32, out: []f32) void {
    for (a, b, out) |x, y, *o| {
        o.* = x + y; // scalar loop; relies entirely on auto-vectorization
    }
}
```

## Good

```zig
const std = @import("std");

fn addArrays(a: []const f32, b: []const f32, out: []f32) void {
    const lanes = 8;
    const Vec = @Vector(lanes, f32);
    var i: usize = 0;

    while (i + lanes <= a.len) : (i += lanes) {
        const va: Vec = a[i..][0..lanes].*;
        const vb: Vec = b[i..][0..lanes].*;
        out[i..][0..lanes].* = va + vb;
    }
    while (i < a.len) : (i += 1) { // scalar remainder
        out[i] = a[i] + b[i];
    }
}

test "vectorized addition" {
    const a = [_]f32{ 1, 2, 3, 4, 5, 6, 7, 8, 9 };
    const b = [_]f32{ 1, 1, 1, 1, 1, 1, 1, 1, 1 };
    var out: [9]f32 = undefined;
    addArrays(&a, &b, &out);
    try std.testing.expectEqual(@as(f32, 10), out[8]);
}
```

## Measure First

`@Vector` earns its added complexity in numeric hot paths confirmed by profiling; for cold or already-fast code, a plain scalar loop that the compiler auto-vectorizes on its own is simpler to read and maintain.

## See Also

- [perf-benchmark-before](perf-benchmark-before.md) - confirming the workload justifies this complexity
- [perf-struct-of-arrays](perf-struct-of-arrays.md) - a data layout change that makes SIMD more effective
- [comptime-known-int](comptime-known-int.md) - compile-time constants often used to size vector lane counts
