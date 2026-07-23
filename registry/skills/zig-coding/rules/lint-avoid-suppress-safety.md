# lint-avoid-suppress-safety

> Avoid `@setRuntimeSafety(false)` outside narrow, justified, profiled hot paths

## Why It Matters

`@setRuntimeSafety(false)` locally disables the same bounds/overflow/`unreachable` checks that `ReleaseSafe` and `Debug` otherwise guarantee, for a specific block of code — a targeted, powerful tool for a proven hot loop, and a dangerous habit if reached for reflexively to silence a check that was actually catching a real bug (see `lint-sanitize-undefined`).

## Bad

```zig
const std = @import("std");

// Disabling safety checks broadly, "to be safe," with no profiling
// evidence this specific function is even a bottleneck.
fn parseAll(allocator: std.mem.Allocator, inputs: []const []const u8) ![]i32 {
    @setRuntimeSafety(false);
    var results = std.ArrayList(i32).init(allocator);
    for (inputs) |input| {
        try results.append(try std.fmt.parseInt(i32, input, 10));
    }
    return results.toOwnedSlice();
}
```

## Good

```zig
const std = @import("std");

// No safety suppression here at all: parsing is not a proven hot path,
// and losing bounds/overflow checks buys nothing measurable.
fn parseAll(allocator: std.mem.Allocator, inputs: []const []const u8) ![]i32 {
    var results = std.ArrayList(i32).init(allocator);
    for (inputs) |input| {
        try results.append(try std.fmt.parseInt(i32, input, 10));
    }
    return results.toOwnedSlice();
}

// Reserved for a specific, profiled hot loop with a documented justification.
fn sumMillions(values: []const u32) u64 {
    // Safety: `values.len` is bounded to 10M elsewhere and each value is
    // capped at u16::MAX, so this sum cannot overflow u64; profiling
    // showed the bounds/overflow checks cost ~8% in this specific loop.
    @setRuntimeSafety(false);
    var total: u64 = 0;
    for (values) |v| total += v;
    return total;
}
```

## See Also

- [lint-sanitize-undefined](lint-sanitize-undefined.md) - the broader case for trusting these checks by default
- [doc-safety-invariants](doc-safety-invariants.md) - documenting exactly what invariant justifies the suppression
- [perf-benchmark-before](perf-benchmark-before.md) - the profiling evidence that should precede this decision
