# alloc-errdefer-cleanup

> Use `errdefer` to clean up partial allocations on the error path only

## Why It Matters

`errdefer` runs its cleanup only if the function returns via an error from that point onward — not on the normal success path. This is exactly the shape needed when building up a multi-step resource: if step three fails, the resources from steps one and two must be released, but if everything succeeds, ownership transfers to the caller and nothing should be freed.

## Bad

```zig
const std = @import("std");

const Buffer = struct { data: []u8, meta: []u8 };

fn createBuffer(allocator: std.mem.Allocator, size: usize) !Buffer {
    const data = try allocator.alloc(u8, size);
    const meta = try allocator.alloc(u8, 16); // if this fails, `data` leaks
    return .{ .data = data, .meta = meta };
}
```

## Good

```zig
const std = @import("std");

const Buffer = struct { data: []u8, meta: []u8 };

fn createBuffer(allocator: std.mem.Allocator, size: usize) !Buffer {
    const data = try allocator.alloc(u8, size);
    errdefer allocator.free(data); // only runs if a later step errors

    const meta = try allocator.alloc(u8, 16);
    errdefer allocator.free(meta);

    try validate(data, meta); // if this errors, both frees run in reverse order

    return .{ .data = data, .meta = meta }; // success: nothing is freed here
}
```

## errdefer with a Captured Error

`errdefer` can bind the propagating error to inspect or log it without altering it:

```zig
fn open(allocator: std.mem.Allocator, path: []const u8) !std.fs.File {
    const owned_path = try allocator.dupe(u8, path);
    errdefer allocator.free(owned_path);

    return std.fs.cwd().openFile(owned_path, .{}) catch |err| {
        std.log.err("failed to open {s}: {s}", .{ owned_path, @errorName(err) });
        return err;
    };
}
```

## See Also

- [alloc-defer-free](alloc-defer-free.md) - the always-runs counterpart for success-path cleanup
- [err-errdefer-rollback](err-errdefer-rollback.md) - the general error-handling pattern behind this rule
- [alloc-free-order](alloc-free-order.md) - keeping multi-resource cleanup order consistent
