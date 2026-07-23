# err-no-unreachable-recoverable

> Never use `unreachable` for an error condition a caller or user can actually trigger

## Why It Matters

`unreachable` tells the compiler "this branch cannot happen" — in `ReleaseFast`/`ReleaseSmall` it compiles to undefined behavior if reached (typically a crash or worse), and even in `Debug`/`ReleaseSafe` it's a hard panic with no recovery. It exists for provable invariants, not for "this should rarely happen" or "I don't want to handle this case." User input, filesystem state, and network data are never "unreachable."

## Bad

```zig
const std = @import("std");

fn parsePort(input: []const u8) u16 {
    // User input can absolutely fail to parse — this is reachable in practice.
    return std.fmt.parseInt(u16, input, 10) catch unreachable;
}
```

## Good

```zig
const std = @import("std");

fn parsePort(input: []const u8) !u16 {
    return std.fmt.parseInt(u16, input, 10);
}

pub fn main() !void {
    const port = parsePort("not-a-number") catch |err| {
        std.log.err("invalid port: {s}", .{@errorName(err)});
        return err;
    };
    _ = port;
}
```

## `unreachable` Is for Compiler-Provable Invariants

```zig
fn describe(day: enum { mon, tue, wed, thu, fri, sat, sun }) []const u8 {
    return switch (day) {
        .mon, .tue, .wed, .thu, .fri => "weekday",
        .sat, .sun => "weekend",
        // No `else` needed: the switch is exhaustive over a closed enum.
        // Reaching for `unreachable` here would be redundant, not wrong,
        // because the compiler already enforces exhaustiveness.
    };
}

// A genuinely appropriate use: values that were already validated upstream
// by a check the compiler can't see, with a comment proving the invariant.
fn charToDigit(c: u8) u4 {
    std.debug.assert(c >= '0' and c <= '9'); // caller-enforced precondition
    return @intCast(c - '0');
}
```

## See Also

- [err-catch-handle](err-catch-handle.md) - handling recoverable errors instead of asserting them away
- [anti-catch-unreachable-abuse](anti-catch-unreachable-abuse.md) - the anti-pattern this rule names directly
- [anti-panic-for-recoverable](anti-panic-for-recoverable.md) - the `@panic` equivalent of this same mistake
