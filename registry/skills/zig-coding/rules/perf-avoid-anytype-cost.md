# perf-avoid-anytype-cost

> Avoid `anytype`-induced monomorphization bloat on genuinely hot, widely-called generic code paths

## Why It Matters

Every distinct type passed to an `anytype` parameter produces its own compiled instantiation of the function, just like an explicit `comptime T` (see `comptime-avoid-bloat`). On a function called from many sites with many different concrete types — a deeply generic logging or serialization helper, say — this can quietly multiply both compile time and instruction-cache pressure (many near-duplicate function bodies competing for icache) without showing up as an obviously "slow" function in a profiler.

## Bad

```zig
const std = @import("std");

// Called with a dozen different writer/logger types across the codebase;
// each callsite's type produces a full separate instantiation of the
// (nontrivial) formatting logic inside.
fn logEvent(writer: anytype, event: anytype) !void {
    try writer.print("[{d}] {s}: {any}\n", .{ std.time.timestamp(), @typeName(@TypeOf(event)), event });
}
```

## Good

```zig
const std = @import("std");

// Narrow the generic surface to the minimum needed: format into a
// concrete []const u8 once, then write that through a single non-generic
// path shared by every caller.
fn logEvent(writer: std.io.AnyWriter, message: []const u8) !void {
    try writer.print("[{d}] {s}\n", .{ std.time.timestamp(), message });
}

test "narrowed generic surface" {
    var buf: [128]u8 = undefined;
    var stream = std.io.fixedBufferStream(&buf);
    try logEvent(stream.writer().any(), "started");
}
```

## When `anytype` Genuinely Belongs

A thin, single-call-site adapter, or a function whose whole point is compile-time specialization per type (see `comptime-specialize-branch`), is a fine use of `anytype` — the concern here is specifically fan-out: many call sites, many distinct types, non-trivial body.

## See Also

- [comptime-avoid-bloat](comptime-avoid-bloat.md) - the general mechanism this rule is a special case of
- [comptime-anytype-discipline](comptime-anytype-discipline.md) - the API-design framing of when `anytype` is appropriate
- [anti-anytype-overuse](anti-anytype-overuse.md) - the anti-pattern write-up of this same overuse
