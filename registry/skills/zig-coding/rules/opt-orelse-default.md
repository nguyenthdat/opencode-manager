# opt-orelse-default

> Use `orelse` to provide a default, early-return, or panic when an optional is `null`

## Why It Matters

`orelse` is the primary way to resolve a `?T` into a plain `T`: it evaluates its right-hand side only when the left side is `null`, and that right-hand side can be a default value, a `return`/`break`/`continue`, or `unreachable`/`@panic` when `null` is provably impossible. This keeps optional-handling code linear instead of nested under an `if`.

## Bad

```zig
const std = @import("std");

fn portOrDefault(config_port: ?u16) u16 {
    if (config_port) |port| {
        return port;
    } else {
        return 8080;
    }
}
```

## Good

```zig
const std = @import("std");

fn portOrDefault(config_port: ?u16) u16 {
    return config_port orelse 8080;
}

// orelse with early return, inside a function that itself returns an optional.
fn firstEvenDoubled(items: []const i32) ?i32 {
    const first_even = blk: {
        for (items) |item| {
            if (@mod(item, 2) == 0) break :blk item;
        }
        break :blk null;
    } orelse return null;
    return first_even * 2;
}

// orelse with a panic, only when null is a proven-impossible programmer error.
fn firstItem(items: []const i32) i32 {
    return (if (items.len > 0) items[0] else null) orelse unreachable;
}
```

## `orelse` vs. `if`

Reach for `orelse` when you only need the fallback value or a control-flow jump; reach for `if (x) |val|` (see `opt-if-capture`) when you need to branch on both the `null` and non-`null` cases with real logic in each branch.

## See Also

- [opt-if-capture](opt-if-capture.md) - branching on both cases instead of just providing a fallback
- [opt-optional-type](opt-optional-type.md) - the `?T` type `orelse` operates on
- [err-orelse-optional](err-orelse-optional.md) - keeping `orelse` and `catch` conceptually distinct
