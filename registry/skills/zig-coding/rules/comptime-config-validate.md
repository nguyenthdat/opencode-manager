# comptime-config-validate

> Validate compile-time-known configuration and invariants inside a `comptime` block

## Why It Matters

When a configuration value, buffer size, or type relationship is known at compile time, checking it in a `comptime` block turns a whole class of misconfiguration into a build failure instead of a runtime bug report. This is especially valuable for library code where callers instantiate generics with parameters that must satisfy some invariant (a power-of-two size, a non-zero capacity, matching field counts).

## Bad

```zig
const std = @import("std");

// If `capacity` is zero, this silently produces a useless ring buffer with
// no compile-time signal that something is wrong.
fn RingBuffer(comptime T: type, comptime capacity: usize) type {
    return struct {
        data: [capacity]T = undefined,
        head: usize = 0,
        len: usize = 0,
    };
}
```

## Good

```zig
const std = @import("std");

fn RingBuffer(comptime T: type, comptime capacity: usize) type {
    comptime {
        if (capacity == 0) @compileError("RingBuffer capacity must be > 0");
        if (!std.math.isPowerOfTwo(capacity)) {
            @compileError("RingBuffer capacity must be a power of two for fast index masking");
        }
    }

    return struct {
        data: [capacity]T = undefined,
        head: usize = 0,
        len: usize = 0,

        const mask = capacity - 1;

        pub fn push(self: *@This(), value: T) void {
            self.data[(self.head + self.len) & mask] = value;
            self.len += 1;
        }
    };
}

test "power of two enforced at compile time" {
    var rb: RingBuffer(u8, 16) = .{};
    rb.push(1);
    try std.testing.expectEqual(@as(usize, 1), rb.len);
}
```

## See Also

- [comptime-compile-error](comptime-compile-error.md) - the mechanism used to reject invalid configuration
- [comptime-block-compute](comptime-block-compute.md) - running arbitrary computation at compile time
- [comptime-generic-struct](comptime-generic-struct.md) - the generic types whose parameters get validated here
