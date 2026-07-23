# name-types-titlecase

> Use `TitleCase` for types: structs, enums, unions, error sets, and functions that return a `type`

## Why It Matters

Zig's style convention (followed throughout the standard library) uses `TitleCase` for anything that names a type, including generic-type-returning functions like `ArrayList` or `HashMap(K, V)` — since calling them *is* how you get the type. This visually distinguishes "this identifier names a type" from "this identifier names a value or function" at a glance, without needing to check a declaration.

## Bad

```zig
const std = @import("std");

const user_account = struct { // types should be TitleCase, not snake_case
    id: u64,
    name: []const u8,
};

const httpMethod = enum { get, post, put, delete }; // should be TitleCase too
```

## Good

```zig
const std = @import("std");

const UserAccount = struct {
    id: u64,
    name: []const u8,
};

const HttpMethod = enum { get, post, put, delete };

// A function returning `type` is also TitleCase, since calling it *is*
// how callers obtain a type — matches std.ArrayList, std.HashMap, etc.
fn Stack(comptime T: type) type {
    return struct { items: std.ArrayListUnmanaged(T) = .{} };
}

test "titlecase types" {
    const account = UserAccount{ .id = 1, .name = "alice" };
    var stack: Stack(u32) = .{};
    _ = account;
    _ = stack;
}
```

## See Also

- [name-funcs-camelcase](name-funcs-camelcase.md) - the complementary convention for ordinary functions and values
- [name-error-set-members](name-error-set-members.md) - naming convention for error set members specifically
- [comptime-generic-struct](comptime-generic-struct.md) - the type-returning functions this convention applies to
