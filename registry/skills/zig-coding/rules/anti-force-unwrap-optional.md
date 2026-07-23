# anti-force-unwrap-optional

> Don't reach for `.?` as a shortcut around properly handling a `null` case

## Why It Matters

`optional.?` panics immediately if the value is `null` — it's shorthand for `orelse unreachable`, a promise that `null` is provably impossible at that point. Using it as a quick way to "make the type checker happy" without actually verifying that invariant reintroduces exactly the class of crash `?T` exists to prevent.

## Bad

```zig
const std = @import("std");

fn getUserName(users: std.AutoHashMap(u64, []const u8), id: u64) []const u8 {
    return users.get(id).?; // crashes the moment `id` isn't in the map
}
```

## Good

```zig
const std = @import("std");

fn getUserName(users: std.AutoHashMap(u64, []const u8), id: u64) ?[]const u8 {
    return users.get(id);
}

pub fn main() !void {
    var users = std.AutoHashMap(u64, []const u8).init(std.heap.page_allocator);
    defer users.deinit();
    try users.put(1, "alice");

    const name = getUserName(users, 2) orelse "unknown";
    std.debug.print("{s}\n", .{name});
}
```

## See Also

- [opt-avoid-force-unwrap](opt-avoid-force-unwrap.md) - the full rule this anti-pattern violates
- [opt-if-capture](opt-if-capture.md) - the safe alternative for branching on both cases
- [opt-orelse-default](opt-orelse-default.md) - the safe alternative for providing a fallback
