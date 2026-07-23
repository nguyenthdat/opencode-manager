# api-comptime-interface

> Design comptime "interfaces" as a documented, duck-typed method contract, not an enforced language construct

## Why It Matters

Since Zig has no `interface`/`trait` declaration, a comptime interface is really a convention: "any type with methods matching this shape can be passed here." Because the compiler doesn't check this contract until instantiation (when the generic function actually calls the methods), the contract needs to be documented explicitly — in a doc comment, or via an explicit `comptime` validation block — so callers know what's expected without reading the generic function's entire body.

## Bad

```zig
const std = @import("std");

// The only way to discover what `T` needs to support is to read every line
// of this function and infer the contract from usage.
fn runAll(comptime T: type, items: []T) void {
    for (items) |*item| {
        item.reset();
        item.process();
    }
}
```

## Good

```zig
const std = @import("std");

/// `T` must provide:
///   - `fn reset(self: *T) void`
///   - `fn process(self: *T) void`
fn runAll(comptime T: type, items: []T) void {
    comptime {
        if (!@hasDecl(T, "reset")) @compileError(@typeName(T) ++ " must implement reset()");
        if (!@hasDecl(T, "process")) @compileError(@typeName(T) ++ " must implement process()");
    }
    for (items) |*item| {
        item.reset();
        item.process();
    }
}

const Task = struct {
    done: bool = false,
    fn reset(self: *Task) void {
        self.done = false;
    }
    fn process(self: *Task) void {
        self.done = true;
    }
};

test "documented comptime interface" {
    var tasks = [_]Task{ .{}, .{} };
    runAll(Task, &tasks);
    try std.testing.expect(tasks[0].done);
}
```

## See Also

- [comptime-duck-interface](comptime-duck-interface.md) - the mechanism behind comptime interfaces
- [comptime-compile-error](comptime-compile-error.md) - producing a clear message when the contract isn't met
- [doc-doc-comment-slash3](doc-doc-comment-slash3.md) - documenting the contract for human readers, not just the compiler
