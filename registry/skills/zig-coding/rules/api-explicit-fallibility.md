# api-explicit-fallibility

> Keep function signatures honest — if it can fail or allocate, the type says so

## Why It Matters

Zig has no exceptions and no hidden allocation, so a function's signature is a complete, checkable contract: `!T` means it can fail, an `std.mem.Allocator` parameter means it can allocate, `*T` vs `T` for `self` tells you whether it mutates. Preserving that honesty — never wrapping a fallible operation in `catch unreachable` just to present a non-fallible-looking signature, never hiding an allocation behind a global — is what makes Zig code reviewable from signatures alone.

## Bad

```zig
const std = @import("std");

// The signature claims this cannot fail, but internally it's silently
// converting real failures into a bogus default — callers can't tell
// success from a masked I/O error.
fn readPort(path: []const u8) u16 {
    const data = std.fs.cwd().readFileAlloc(std.heap.page_allocator, path, 16) catch return 8080;
    defer std.heap.page_allocator.free(data);
    return std.fmt.parseInt(u16, std.mem.trim(u8, data, " \n"), 10) catch 8080;
}
```

## Good

```zig
const std = @import("std");

fn readPort(allocator: std.mem.Allocator, path: []const u8) !u16 {
    const data = try std.fs.cwd().readFileAlloc(allocator, path, 16);
    defer allocator.free(data);
    return std.fmt.parseInt(u16, std.mem.trim(u8, data, " \n"), 10);
}

// If a default really is the intended, documented behavior, the signature
// should still say the function can fail internally before deciding to fall back:
fn readPortOrDefault(allocator: std.mem.Allocator, path: []const u8) u16 {
    return readPort(allocator, path) catch 8080; // failure is visible at the call site
}
```

## See Also

- [err-error-union-return](err-error-union-return.md) - the mechanism for signaling fallibility honestly
- [alloc-avoid-hidden](alloc-avoid-hidden.md) - the allocation half of this same honesty principle
- [api-no-hidden-control-flow](api-no-hidden-control-flow.md) - the broader principle this rule is one instance of
