# err-orelse-optional

> Use `orelse` to resolve optionals; reserve `catch` for error unions — don't blur the two

## Why It Matters

`?T` (optional) and `!T` (error union) are different types with different unwrapping operators: `orelse` provides a fallback (or early-returns/panics) for a `null` optional, while `catch` does the equivalent for an error union's error case. Keeping them distinct in your head — and in code — makes it obvious whether "nothing here" is an expected, information-free absence (`?T`) or a specific failure with a reason (`!T`).

## Bad

```zig
const std = @import("std");

// Modeling "not found" as an error union with a single, contentless error
// forces every caller to write catch-boilerplate for what's really just "no value."
fn findUser(users: []const User, id: u64) error{NotFound}!User {
    for (users) |user| {
        if (user.id == id) return user;
    }
    return error.NotFound;
}
```

## Good

```zig
const std = @import("std");

// "Not found" carries no error information beyond absence — model it as ?T.
fn findUser(users: []const User, id: u64) ?User {
    for (users) |user| {
        if (user.id == id) return user;
    }
    return null;
}

pub fn main() void {
    const users = [_]User{.{ .id = 1, .name = "alice" }};

    const user = findUser(&users, 2) orelse {
        std.log.info("no such user, using guest", .{});
        return;
    };
    _ = user;

    // Or provide an inline default:
    const fallback = findUser(&users, 2) orelse User{ .id = 0, .name = "guest" };
    _ = fallback;
}

const User = struct { id: u64, name: []const u8 };
```

## `orelse` Can Also Propagate

Inside a function that itself returns `?T` or `!T`, `orelse return null` / `orelse return err` chains cleanly:

```zig
fn firstAdminName(users: []const User) ?[]const u8 {
    const admin = findAdmin(users) orelse return null;
    return admin.name;
}
```

## See Also

- [opt-optional-type](opt-optional-type.md) - the `?T` shape this operator unwraps
- [opt-null-vs-error](opt-null-vs-error.md) - the deciding question between `?T` and `!T`
- [err-catch-handle](err-catch-handle.md) - the error-union counterpart to `orelse`
