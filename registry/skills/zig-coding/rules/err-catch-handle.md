# err-catch-handle

> Use `catch |err| { ... }` to actually handle or recover from an error, not just to silence it

## Why It Matters

`catch` is where an error union's failure path gets real logic: a fallback value, a retry, a translated error, or a log-and-continue decision. The danger is using `catch` as a way to make an error union "go away" without engaging with what failed — see `anti-ignore-error-union` for that trap. Used well, `catch` is precise and visible about which errors are handled and how.

## Bad

```zig
const std = @import("std");

// Swallows every possible error identically, with no distinction and no log.
fn loadPort(input: []const u8) u16 {
    return std.fmt.parseInt(u16, input, 10) catch 8080;
}
```

## Good

```zig
const std = @import("std");

fn loadPort(input: []const u8) u16 {
    return std.fmt.parseInt(u16, input, 10) catch |err| {
        std.log.warn("invalid PORT '{s}' ({s}), defaulting to 8080", .{ input, @errorName(err) });
        return 8080;
    };
}

// Handle specific errors differently via `catch` + `switch`.
fn openOrCreate(path: []const u8) !std.fs.File {
    return std.fs.cwd().openFile(path, .{ .mode = .read_write }) catch |err| switch (err) {
        error.FileNotFound => std.fs.cwd().createFile(path, .{ .read = true }),
        else => err,
    };
}
```

## `catch unreachable` Is a Promise, Not a Shrug

`catch unreachable` tells the compiler "this error branch is provably impossible here." Only use it when you can point at the invariant that guarantees it — otherwise it becomes a crash waiting to happen (see `anti-catch-unreachable-abuse`):

```zig
// Safe: the literal is known-valid at compile time, parsing it cannot fail.
const timeout_ms = std.fmt.parseInt(u32, "3000", 10) catch unreachable;
```

## See Also

- [err-try-propagate](err-try-propagate.md) - propagate instead of handle, when the caller should decide
- [err-return-vs-log](err-return-vs-log.md) - choosing between returning up and handling locally
- [anti-catch-unreachable-abuse](anti-catch-unreachable-abuse.md) - misusing `catch unreachable` on genuinely fallible paths
