# anti-ignore-error-union

> Don't discard an error union's failure case silently — `catch {}` without at least a comment is a red flag

## Why It Matters

An empty `catch {}` compiles cleanly and makes a real failure vanish without a trace — no log, no propagation, nothing. The next person debugging a mysterious missing side effect (a file that should have been written, a notification that should have been sent) has no way to discover that an error occurred and was silently swallowed right here.

## Bad

```zig
const std = @import("std");

fn saveState(path: []const u8, data: []const u8) void {
    std.fs.cwd().writeFile(.{ .sub_path = path, .data = data }) catch {}; // silently vanishes
}
```

## Good

```zig
const std = @import("std");

fn saveState(path: []const u8, data: []const u8) void {
    std.fs.cwd().writeFile(.{ .sub_path = path, .data = data }) catch |err| {
        std.log.err("failed to save state to '{s}': {s}", .{ path, @errorName(err) });
    };
}

// Or, better still, let the caller decide by propagating instead of swallowing:
fn saveStateOrFail(path: []const u8, data: []const u8) !void {
    try std.fs.cwd().writeFile(.{ .sub_path = path, .data = data });
}
```

## See Also

- [err-return-vs-log](err-return-vs-log.md) - deciding the right layer to handle vs. propagate an error
- [err-catch-handle](err-catch-handle.md) - handling an error with real logic instead of discarding it
- [name-underscore-unused](name-underscore-unused.md) - deliberately discarding a value, distinct from silently swallowing an error
