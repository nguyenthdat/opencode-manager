# proj-pub-visibility

> Default to file-private visibility; expose only the declarations that are genuinely part of the public contract

## Why It Matters

A declaration without `pub` is only visible within its own file — Zig's visibility model is deliberately simple (no `private`/`protected`/`internal` gradations, just "this file" vs. "importable from elsewhere"). Marking everything `pub` "just in case" erases the signal about what's actually meant to be depended on from outside, making later refactors riskier since any of those accidentally-public declarations might already have external callers.

## Bad

```zig
const std = @import("std");

// Every helper marked pub "to be safe" — callers now have no way to tell
// which of these are meant to be depended on versus incidental implementation detail.
pub fn parseLine(line: []const u8) !Entry {
    return .{ .value = try parseValue(line) };
}

pub fn parseValue(input: []const u8) !i32 {
    return std.fmt.parseInt(i32, input, 10);
}

pub const Entry = struct { value: i32 };
```

## Good

```zig
const std = @import("std");

pub fn parseLine(line: []const u8) !Entry {
    return .{ .value = try parseValue(line) };
}

// Private: an implementation detail of parseLine, free to change later
// without worrying about external callers.
fn parseValue(input: []const u8) !i32 {
    return std.fmt.parseInt(i32, input, 10);
}

pub const Entry = struct { value: i32 };
```

## See Also

- [doc-public-api-only](doc-public-api-only.md) - documenting `pub` declarations more thoroughly than private ones
- [api-namespace-file](api-namespace-file.md) - curating exactly what a file's namespace exposes as its public surface
- [api-public-fields-vs-methods](api-public-fields-vs-methods.md) - the same visibility discipline applied to struct fields
