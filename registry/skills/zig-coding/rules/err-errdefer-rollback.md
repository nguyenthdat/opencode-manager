# err-errdefer-rollback

> Use `errdefer` for rollback semantics whenever a multi-step operation can partially succeed

## Why It Matters

Many operations touch more than one resource — write a file, then update an index; allocate a struct, then register it in a registry. If a later step fails, earlier side effects need to be undone so the system doesn't end up in a half-committed state. `errdefer` expresses exactly this: "if we leave this function via an error, undo what I just did."

## Bad

```zig
const std = @import("std");

fn createAccount(allocator: std.mem.Allocator, registry: *Registry, name: []const u8) !Account {
    const account = try Account.init(allocator, name);
    try registry.register(account.id); // if this fails, `account` is now orphaned
    return account;
}
```

## Good

```zig
const std = @import("std");

fn createAccount(allocator: std.mem.Allocator, registry: *Registry, name: []const u8) !Account {
    var account = try Account.init(allocator, name);
    errdefer account.deinit();

    try registry.register(account.id);
    errdefer registry.unregister(account.id);

    try account.markActive();
    return account;
}
```

## Rollback Across External Side Effects

`errdefer` works just as well for non-memory rollback — deleting a file that was partially written, releasing a lease, decrementing a counter:

```zig
fn writeAtomic(path: []const u8, data: []const u8) !void {
    const tmp_path = try std.fmt.allocPrint(std.heap.page_allocator, "{s}.tmp", .{path});
    defer std.heap.page_allocator.free(tmp_path);

    const file = try std.fs.cwd().createFile(tmp_path, .{});
    errdefer std.fs.cwd().deleteFile(tmp_path) catch {};
    defer file.close();

    try file.writeAll(data);
    try std.fs.cwd().rename(tmp_path, path);
}
```

## See Also

- [alloc-errdefer-cleanup](alloc-errdefer-cleanup.md) - the memory-specific instance of this same pattern
- [err-catch-handle](err-catch-handle.md) - handling the error after rollback instead of re-propagating
- [api-error-union-in-init](api-error-union-in-init.md) - surfacing partial-construction failure through `init`
