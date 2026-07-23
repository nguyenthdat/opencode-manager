# opt-avoid-force-unwrap

> Avoid `.?` (force-unwrap) outside contexts where `null` is provably impossible

## Why It Matters

`optional.?` is shorthand for `optional orelse unreachable` — it panics immediately if the value is `null`. Reaching for it as a shortcut around properly handling the `null` case reintroduces the exact class of crash that `?T` exists to prevent, just spelled differently. It should be about as rare as `unreachable` itself, and for the same reason: it's a promise about an invariant, not a way to avoid writing a branch.

## Bad

```zig
const std = @import("std");

fn firstName(names: []const []const u8) []const u8 {
    // If `names` is ever empty, this panics in production with no
    // recoverable path — a caller passing an empty slice is entirely plausible.
    return names[0];
}

fn getPort(config: ?u16) u16 {
    return config.?; // crashes the moment config is unset
}
```

## Good

```zig
const std = @import("std");

fn firstName(names: []const []const u8) ?[]const u8 {
    if (names.len == 0) return null;
    return names[0];
}

fn getPort(config: ?u16) u16 {
    return config orelse 8080;
}
```

## When `.?` Is Justified

```zig
// Immediately after a check that makes null structurally impossible,
// in the same expression or an adjacent line, with the invariant obvious.
var map = std.AutoHashMap(u32, []const u8).init(std.heap.page_allocator);
defer map.deinit();
map.put(1, "one") catch unreachable;

if (map.count() > 0) {
    const entry = map.get(1).?; // just inserted this key unconditionally above
    _ = entry;
}
```

Even in the justified case, prefer restructuring to `if (x) |val|` or `orelse` where practical — `.?` should be the last resort, not the default reflex.

## See Also

- [opt-if-capture](opt-if-capture.md) - the safe alternative for branching on both cases
- [opt-orelse-default](opt-orelse-default.md) - the safe alternative for providing a fallback
- [anti-force-unwrap-optional](anti-force-unwrap-optional.md) - the anti-pattern write-up of unchecked `.?` usage
