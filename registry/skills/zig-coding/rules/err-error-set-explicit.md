# err-error-set-explicit

> Declare explicit, named error sets for public API boundaries

## Why It Matters

An inferred error set (`!T` with no named set) is convenient, but it's *derived* from the function body — adding a call inside the function can silently widen the public error contract for every caller. A named `error{...}` set at a public boundary documents exactly what can go wrong, gives callers something concrete to `switch` on, and only changes when you deliberately edit it.

## Bad

```zig
const std = @import("std");

// The public error surface is whatever the body happens to produce today —
// callers can't know what to expect without reading the implementation,
// and it can change under them across a minor version bump.
pub fn loadUser(allocator: std.mem.Allocator, id: u64) !User {
    const path = try std.fmt.allocPrint(allocator, "users/{d}.json", .{id});
    defer allocator.free(path);
    const data = try std.fs.cwd().readFileAlloc(allocator, path, 1 << 16);
    defer allocator.free(data);
    return parseUser(data);
}
```

## Good

```zig
const std = @import("std");

pub const LoadUserError = error{
    UserNotFound,
    InvalidUserData,
    OutOfMemory,
};

pub fn loadUser(allocator: std.mem.Allocator, id: u64) LoadUserError!User {
    const path = std.fmt.allocPrint(allocator, "users/{d}.json", .{id}) catch
        return error.OutOfMemory;
    defer allocator.free(path);

    const data = std.fs.cwd().readFileAlloc(allocator, path, 1 << 16) catch |err| switch (err) {
        error.FileNotFound => return error.UserNotFound,
        error.OutOfMemory => return error.OutOfMemory,
        else => return error.InvalidUserData,
    };
    defer allocator.free(data);

    return parseUser(data) catch error.InvalidUserData;
}
```

## Merging Sets from Dependencies

Combine error sets with `||` to expose a stable union without re-listing every variant by hand:

```zig
const IoError = std.fs.File.ReadError;
const ParseError = error{InvalidUserData};
pub const LoadUserError = IoError || ParseError;
```

## See Also

- [err-error-set-inferred](err-error-set-inferred.md) - when the lighter-weight inferred form is fine instead
- [err-merge-error-sets](err-merge-error-sets.md) - combining sets from multiple layers
- [doc-error-set-document](doc-error-set-document.md) - documenting what triggers each error
