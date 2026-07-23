# opt-nested-optional-avoid

> Avoid nested optionals and optional-inside-error-union confusion; flatten with `orelse`/`if` chains

## Why It Matters

`??T` is legal but rarely what you actually want — it distinguishes three states (`null`, `?T` that's itself `null`, and a real `T`) where two are usually meant to collapse into one "absent" case. Similarly, `!?T` and `?!T` read as almost the same thing but mean different things structurally. Flattening these early, at the boundary where they're produced, keeps the rest of the function working with a single, simple `?T` or `!T`.

## Bad

```zig
const std = @import("std");

// Two different "nothing here" states that almost certainly should be one.
fn lookupThenFind(map: std.StringHashMap([]const u32), key: []const u8, needle: u32) ??usize {
    const list = map.get(key) orelse return null; // outer null: no such key
    for (list, 0..) |v, i| {
        if (v == needle) return i; // coerces to ??usize — confusing to read
    }
    return null; // inner null: key existed, value not found
}
```

## Good

```zig
const std = @import("std");

// Flatten immediately: both "no such key" and "key exists but no match"
// collapse into the same, single-level absence.
fn lookupThenFind(map: std.StringHashMap([]const u32), key: []const u8, needle: u32) ?usize {
    const list = map.get(key) orelse return null;
    for (list, 0..) |v, i| {
        if (v == needle) return i;
    }
    return null;
}
```

## Flattening `!?T` at the Boundary

```zig
// Instead of propagating `!?T` deep into calling code, resolve it where
// the distinction between "error" and "absent" actually matters, then
// hand callers a single, simple type.
fn readOptionalField(allocator: std.mem.Allocator, path: []const u8) !?[]u8 {
    const data = std.fs.cwd().readFileAlloc(allocator, path, 1 << 16) catch |err| switch (err) {
        error.FileNotFound => return null, // absence, not failure
        else => return err, // genuine failure
    };
    return data;
}
```

## See Also

- [opt-null-vs-error](opt-null-vs-error.md) - choosing one shape instead of stacking both
- [opt-optional-type](opt-optional-type.md) - the single-level `?T` this rule keeps you at
- [err-orelse-optional](err-orelse-optional.md) - keeping optional and error-union handling distinct
