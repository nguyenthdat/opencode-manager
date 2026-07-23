# perf-comptime-lookup-table

> Precompute lookup tables at compile time with `comptime` instead of building them at runtime startup

## Why It Matters

A lookup table whose contents depend only on compile-time-known data (character classification, a CRC polynomial's precomputed table, a sine wave for audio synthesis) costs nothing at runtime if built inside a `comptime` block — it's baked directly into the binary's data section, with zero startup-time computation and zero risk of the initialization code introducing a runtime bug.

## Bad

```zig
const std = @import("std");

var crc_table: [256]u32 = undefined;
var crc_table_initialized = false;

fn ensureCrcTable() void {
    if (crc_table_initialized) return;
    for (0..256) |i| {
        var crc: u32 = @intCast(i);
        for (0..8) |_| {
            crc = if (crc & 1 != 0) (crc >> 1) ^ 0xEDB88320 else crc >> 1;
        }
        crc_table[i] = crc;
    }
    crc_table_initialized = true; // runtime work + a lazy-init race in threaded code
}
```

## Good

```zig
const std = @import("std");

const crc_table: [256]u32 = blk: {
    var table: [256]u32 = undefined;
    for (0..256) |i| {
        var crc: u32 = @intCast(i);
        for (0..8) |_| {
            crc = if (crc & 1 != 0) (crc >> 1) ^ 0xEDB88320 else crc >> 1;
        }
        table[i] = crc;
    }
    break :blk table;
};

fn crc32Byte(byte: u8) u32 {
    return crc_table[byte]; // zero runtime initialization, no race, no lazy-init check
}

test "comptime CRC table" {
    try std.testing.expectEqual(crc_table[0], 0);
}
```

## See Also

- [comptime-block-compute](comptime-block-compute.md) - the general mechanism this rule specializes
- [perf-avoid-alloc-hot-path](perf-avoid-alloc-hot-path.md) - another way to remove runtime cost from hot paths
- [comptime-known-int](comptime-known-int.md) - the arbitrary-precision arithmetic available inside these blocks
