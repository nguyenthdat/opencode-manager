# anti-panic-for-recoverable

> Don't use `@panic` for a condition a caller could reasonably recover from

## Why It Matters

`@panic` unwinds the program immediately with no recovery path — appropriate for a genuine programming error (an invariant violated, a state that should be structurally impossible), but the wrong tool for anything a caller could sensibly handle: a missing file, invalid user input, a network timeout. Reaching for `@panic` there takes a recoverable situation and makes it fatal.

## Bad

```zig
const std = @import("std");

fn loadConfig(path: []const u8) Config {
    const file = std.fs.cwd().openFile(path, .{}) catch {
        @panic("config file not found"); // a missing file is entirely recoverable
    };
    defer file.close();
    return Config{};
}

const Config = struct {};
```

## Good

```zig
const std = @import("std");

fn loadConfig(path: []const u8) !Config {
    const file = try std.fs.cwd().openFile(path, .{});
    defer file.close();
    return Config{};
}

pub fn main() !void {
    const config = loadConfig("app.toml") catch |err| blk: {
        std.log.warn("using defaults: {s}", .{@errorName(err)});
        break :blk Config{};
    };
    _ = config;
}

const Config = struct {};
```

## `@panic` Still Has a Place

```zig
fn assertInvariant(items: []const i32) void {
    if (items.len == 0) @panic("assertInvariant called with an empty slice — caller bug");
    // A genuine "this should never happen if the caller followed the contract" case.
}
```

## See Also

- [err-no-unreachable-recoverable](err-no-unreachable-recoverable.md) - the `unreachable` counterpart to this same mistake
- [api-error-union-in-init](api-error-union-in-init.md) - surfacing construction failure through errors instead of panics
- [err-error-union-return](err-error-union-return.md) - the correct mechanism for recoverable failure
