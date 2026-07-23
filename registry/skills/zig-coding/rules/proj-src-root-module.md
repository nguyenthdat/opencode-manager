# proj-src-root-module

> Keep a clear root module (`root.zig`/`main.zig`) that separates library logic from the executable entry point

## Why It Matters

Splitting "the actual logic" (in a `root.zig` exposed as a library module) from "the thin executable entry point" (`main.zig`, which just calls into the library) means the logic is independently testable, reusable from multiple binaries, and importable by other projects via `build.zig.zon` — none of which is possible if everything lives directly in `main.zig`'s `pub fn main`.

## Bad

```zig
// main.zig — all logic, parsing, and I/O crammed directly into main;
// nothing here is reusable or testable without going through the CLI.
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    // ... 200 lines of business logic directly inside main ...
}
```

## Good

```zig
// root.zig — the library: all real logic lives here, fully testable.
const std = @import("std");

pub fn run(allocator: std.mem.Allocator, args: []const []const u8) !void {
    _ = allocator;
    _ = args;
}

test "run handles empty args" {
    try run(std.testing.allocator, &.{});
}
```

```zig
// main.zig — thin entry point, delegates immediately to the library.
const std = @import("std");
const app = @import("app_lib"); // imported per proj-build-zig-module

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    try app.run(allocator, args);
}
```

## See Also

- [proj-lib-main-split](../rust-coding/rules/proj-lib-main-split.md) - the analogous Rust rule, for comparison
- [proj-build-zig-module](proj-build-zig-module.md) - wiring `root.zig` as an importable module in `build.zig`
- [name-files-as-namespace](name-files-as-namespace.md) - naming conventions for the root module and its file
