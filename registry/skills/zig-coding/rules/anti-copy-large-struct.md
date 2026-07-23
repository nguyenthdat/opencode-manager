# anti-copy-large-struct

> Don't copy large structs by value unnecessarily — pass a pointer instead

## Why It Matters

Zig has no move semantics distinct from copy for ordinary struct assignment/parameter-passing — assigning or passing a struct by value copies its bytes. For a small struct (a couple of integers), that's free; for a large struct (embedded arrays, many fields), passing it by value into every function call (or storing copies in a loop) can dominate a function's actual cost with pure memory-copying overhead that a pointer would avoid entirely.

## Bad

```zig
const std = @import("std");

const LargeConfig = struct {
    settings: [256]u8 = undefined,
    metadata: [64]u8 = undefined,
};

// Each call copies 320 bytes, even though the function only reads a
// couple of them.
fn checksumByte(config: LargeConfig, index: usize) u8 {
    return config.settings[index];
}
```

## Good

```zig
const std = @import("std");

const LargeConfig = struct {
    settings: [256]u8 = undefined,
    metadata: [64]u8 = undefined,
};

// A pointer receiver avoids copying the 320-byte struct on every call.
fn checksumByte(config: *const LargeConfig, index: usize) u8 {
    return config.settings[index];
}

test "pointer avoids copying a large struct" {
    var config = LargeConfig{};
    config.settings[0] = 42;
    try std.testing.expectEqual(@as(u8, 42), checksumByte(&config, 0));
}
```

## Small Structs Are Fine to Copy

```zig
const Point = struct { x: f64, y: f64 }; // 16 bytes: copying this is cheaper than indirecting through a pointer
fn length(p: Point) f64 {
    return @sqrt(p.x * p.x + p.y * p.y);
}
```

## See Also

- [api-self-value-vs-ptr](api-self-value-vs-ptr.md) - the full rule this anti-pattern violates
- [own-move-large](../rust-coding/rules/own-move-large.md) - the analogous Rust concern, for comparison
- [perf-struct-of-arrays](perf-struct-of-arrays.md) - a related layout technique for large collections of such structs
