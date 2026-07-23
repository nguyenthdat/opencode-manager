# opt-null-vs-error

> Choose `?T` when absence is expected and information-free; choose `!T` when failure has a reason

## Why It Matters

The two "something might not be there" tools in Zig aren't interchangeable: `?T` says "this might simply not exist, and that's a normal outcome with nothing more to say about it." `!T` says "this operation can fail, and the failure has a specific, nameable cause the caller might want to branch on." Picking the wrong one either forces meaningless error-set boilerplate for a plain absence, or throws away diagnostic information a caller genuinely needs.

## Bad

```zig
const std = @import("std");

// "Not found" is a normal, common outcome of a lookup — modeling it as an
// error set with exactly one member adds ceremony without adding meaning.
fn findUser(id: u64) error{NotFound}!User {
    _ = id;
    return error.NotFound;
}

// Meanwhile, a real I/O failure squashed into an optional loses *why* it failed.
fn readConfig(path: []const u8) ??[]u8 {
    _ = path;
    return null; // was it missing? permission denied? disk full? no way to tell.
}
```

## Good

```zig
const std = @import("std");

// Absence with no further explanation needed: ?T.
fn findUser(users: []const User, id: u64) ?User {
    for (users) |user| {
        if (user.id == id) return user;
    }
    return null;
}

// A real failure with distinguishable causes: !T.
fn readConfig(allocator: std.mem.Allocator, path: []const u8) ![]u8 {
    return std.fs.cwd().readFileAlloc(allocator, path, 1 << 20);
}

const User = struct { id: u64, name: []const u8 };
```

## The Deciding Question

Ask: "if I told the caller *why* this returned nothing, would that be useful information, or just noise?" A missing hash map key: noise, use `?T`. A failed file read: useful (not found vs. permission denied vs. corrupt), use `!T`.

## See Also

- [opt-optional-type](opt-optional-type.md) - the `?T` side of this decision
- [err-error-union-return](err-error-union-return.md) - the `!T` side of this decision
- [opt-nested-optional-avoid](opt-nested-optional-avoid.md) - avoiding the confusion of combining both
