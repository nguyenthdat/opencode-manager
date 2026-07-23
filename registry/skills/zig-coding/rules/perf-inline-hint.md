# perf-inline-hint

> Use `inline fn`/`@call(.always_inline, ...)` sparingly, for small, genuinely hot functions

## Why It Matters

Zig's compiler already inlines small functions automatically when profitable, in optimized builds — `inline` (as a function qualifier, or via `@call(.always_inline, ...)`) forces inlining regardless of the optimizer's own judgment, which can help a genuinely hot, tiny function avoid call overhead, but can also bloat code size and hurt instruction-cache behavior if overused on larger functions.

## Bad

```zig
const std = @import("std");

// Forcing every function to inline, regardless of size or call frequency,
// fights the optimizer's own (usually better-informed) heuristics.
inline fn parseAndValidateEverything(input: []const u8) !Config {
    // ... fifty lines of logic ...
    _ = input;
    return Config{};
}

const Config = struct {};
```

## Good

```zig
const std = @import("std");

// A tiny, extremely hot accessor is a reasonable inline candidate.
inline fn isSet(flags: u32, bit: u5) bool {
    return (flags & (@as(u32, 1) << bit)) != 0;
}

// A larger function is left to the optimizer's own judgment.
fn parseAndValidateEverything(input: []const u8) !Config {
    _ = input;
    return Config{};
}

const Config = struct {};

test "inline hint on a tiny hot function" {
    try std.testing.expect(isSet(0b0100, 2));
}
```

## Profile Before Forcing Inlining

`inline` should follow evidence (a profiler showing call overhead actually matters for this specific function), not a blanket policy — see `perf-benchmark-before`.

## See Also

- [perf-benchmark-before](perf-benchmark-before.md) - confirming a function is hot enough to warrant this
- [opt-inline-small](../rust-coding/rules/opt-inline-small.md) - the analogous Rust attribute, for comparison
- [comptime-avoid-bloat](comptime-avoid-bloat.md) - a related code-size concern from a different mechanism
