# comptime-known-int

> Let `comptime_int`/`comptime_float` do arbitrary-precision compile-time math before it collapses to a concrete type

## Why It Matters

Integer and float literals in Zig start as `comptime_int`/`comptime_float` — arbitrary-precision, untyped values that only get coerced to a concrete sized type (`u32`, `f64`, ...) at the point they're actually used as one. This means constant expressions can be computed with full precision at compile time and only need to fit the target type at the final assignment, avoiding intermediate overflow that a fixed-width runtime computation could hit.

## Bad

```zig
const std = @import("std");

// Computing this as a runtime u32 multiplication risks overflow for large
// inputs, even though the actual constant fits comfortably.
const seconds_per_year: u32 = 60 * 60 * 24 * 365;
```

## Good

```zig
const std = @import("std");

// Every literal and intermediate here is `comptime_int` (arbitrary precision)
// until the final coercion — no risk of intermediate overflow.
const seconds_per_year: u64 = 60 * 60 * 24 * 365;

// comptime_int also lets you write self-documenting derived constants safely:
const bytes_per_page: usize = 4 * 1024;
const pages_per_chunk: usize = 16;
const bytes_per_chunk: usize = bytes_per_page * pages_per_chunk;

test "comptime constant math" {
    try std.testing.expectEqual(@as(u64, 31_536_000), seconds_per_year);
}
```

## Where comptime_int Cannot Go

A `comptime_int` value must be coerced to a concrete type before it can be stored in a runtime-sized location (a struct field, an array element with a computed index) — this is enforced automatically and simply requires an explicit type on the binding once the value crosses that boundary.

## See Also

- [comptime-block-compute](comptime-block-compute.md) - using comptime_int inside larger compile-time computations
- [perf-comptime-lookup-table](perf-comptime-lookup-table.md) - a common consumer of compile-time-computed constants
- [mem-smaller-integers](../rust-coding/rules/mem-smaller-integers.md) - choosing the final concrete integer width, for comparison
