# err-try-propagate

> Use `try` to propagate errors instead of hand-rolled `switch`/`if` unwrapping

## Why It Matters

`try expr` is sugar for "evaluate `expr`; if it's an error, return that error from the enclosing function immediately; otherwise unwrap the success value." Writing that out manually with a `switch` adds noise without adding information — `try` says the same thing in one word and keeps the success-path code linear and readable.

## Bad

```zig
const std = @import("std");

fn readConfig(allocator: std.mem.Allocator, path: []const u8) ![]u8 {
    const result = std.fs.cwd().readFileAlloc(allocator, path, 1 << 20);
    switch (result) {
        else => {}, // this isn't even how error unions are matched — illustrating the awkwardness
    }
    return result catch |err| return err; // roundabout way of writing `try`
}
```

## Good

```zig
const std = @import("std");

fn readConfig(allocator: std.mem.Allocator, path: []const u8) ![]u8 {
    return try std.fs.cwd().readFileAlloc(allocator, path, 1 << 20);
    // (the outer `try` here is actually redundant since the function
    // already returns `![]u8` — see below)
}

// Idiomatic: no `try` needed on a direct tail return of the same error union type.
fn readConfigIdiomatic(allocator: std.mem.Allocator, path: []const u8) ![]u8 {
    return std.fs.cwd().readFileAlloc(allocator, path, 1 << 20);
}

// `try` earns its keep once you do something with the value afterward.
fn readConfigTrimmed(allocator: std.mem.Allocator, path: []const u8) ![]u8 {
    const raw = try std.fs.cwd().readFileAlloc(allocator, path, 1 << 20);
    return std.mem.trim(u8, raw, " \n\r\t");
}
```

## Chaining `try` Across Several Steps

```zig
fn loadAndParse(allocator: std.mem.Allocator, path: []const u8) !Config {
    const raw = try std.fs.cwd().readFileAlloc(allocator, path, 1 << 20);
    defer allocator.free(raw);
    const parsed = try parseConfig(allocator, raw);
    return parsed;
}
```

## See Also

- [err-error-union-return](err-error-union-return.md) - the error-union shape `try` unwraps
- [err-catch-handle](err-catch-handle.md) - the counterpart for actually handling an error instead of propagating it
- [err-errdefer-rollback](err-errdefer-rollback.md) - cleanup that runs specifically on the `try`-triggered error path
