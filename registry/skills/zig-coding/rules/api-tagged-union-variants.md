# api-tagged-union-variants

> Use tagged unions (`union(enum)`) for closed sets of mutually exclusive variants

## Why It Matters

A tagged union associates each variant with a distinct payload type and tracks, at runtime, which variant is currently active — accessing the wrong field is a checked error (a safety-mode panic), not undefined behavior, and `switch` over it is exhaustively checked by the compiler (see `opt-switch-exhaustive`). This is the direct, idiomatic replacement for "a struct with a bunch of optional fields that only some combinations of which are ever valid."

## Bad

```zig
const std = @import("std");

// Every field exists regardless of which "kind" this actually is — most
// combinations are invalid, and nothing enforces which fields matter when.
const Event = struct {
    kind: enum { click, key_press, resize },
    x: i32 = 0,
    y: i32 = 0,
    key_code: u32 = 0,
    width: u32 = 0,
    height: u32 = 0,
};
```

## Good

```zig
const std = @import("std");

const Event = union(enum) {
    click: struct { x: i32, y: i32 },
    key_press: struct { key_code: u32 },
    resize: struct { width: u32, height: u32 },
};

fn describe(event: Event) void {
    switch (event) {
        .click => |c| std.debug.print("click at ({d}, {d})\n", .{ c.x, c.y }),
        .key_press => |k| std.debug.print("key {d}\n", .{k.key_code}),
        .resize => |r| std.debug.print("resize to {d}x{d}\n", .{ r.width, r.height }),
    }
}

test "tagged union events" {
    describe(.{ .click = .{ .x = 10, .y = 20 } });
}
```

## Checking the Active Tag Without a Full Switch

```zig
fn isClick(event: Event) bool {
    return event == .click; // tag comparison, no payload access needed
}
```

## See Also

- [opt-switch-exhaustive](opt-switch-exhaustive.md) - the exhaustiveness guarantee tagged unions enable
- [api-non-exhaustive](../rust-coding/rules/api-non-exhaustive.md) - the Rust analogue, for cross-language comparison
- [err-error-set-explicit](err-error-set-explicit.md) - another closed-set construct with similar exhaustiveness benefits
