# alloc-explicit-param

> Pass `std.mem.Allocator` explicitly as a parameter, never hide it in global state

## Why It Matters

Zig has no implicit global allocator. Every function that needs to allocate takes the allocator it should use as an argument. This makes allocation costs visible at every call site, lets callers choose the allocation strategy (arena, fixed buffer, testing allocator), and keeps libraries usable in constrained environments (embedded, WASM) where a general-purpose heap may not exist.

## Bad

```zig
const std = @import("std");

var global_gpa = std.heap.GeneralPurposeAllocator(.{}){};
const global_allocator = global_gpa.allocator();

// Hidden dependency on a module-level allocator.
pub fn loadConfig(path: []const u8) ![]u8 {
    const file = try std.fs.cwd().openFile(path, .{});
    defer file.close();
    return file.readToEndAlloc(global_allocator, 1 << 20);
}
```

## Good

```zig
const std = @import("std");

// Allocator is an explicit, ordinary argument.
pub fn loadConfig(allocator: std.mem.Allocator, path: []const u8) ![]u8 {
    const file = try std.fs.cwd().openFile(path, .{});
    defer file.close();
    return file.readToEndAlloc(allocator, 1 << 20);
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const config = try loadConfig(gpa.allocator(), "config.toml");
    defer gpa.allocator().free(config);
}
```

## Convention: Allocator First (Usually)

By convention in the standard library, `allocator: std.mem.Allocator` is typically the first parameter of a function, unless the function is a method (`self` comes first) — in which case the allocator usually follows `self`, or is stored on the struct at `init` time (see `alloc-init-deinit-pair`).

## See Also

- [alloc-no-global](alloc-no-global.md) - avoid global/hidden allocator state entirely
- [alloc-init-deinit-pair](alloc-init-deinit-pair.md) - store an allocator on a struct across init/deinit
- [alloc-testing-allocator](alloc-testing-allocator.md) - swap in a leak-detecting allocator in tests
