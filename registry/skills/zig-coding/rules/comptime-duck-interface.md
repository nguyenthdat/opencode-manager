# comptime-duck-interface

> Use comptime duck-typed "interfaces" for static dispatch instead of a runtime vtable when the set of implementations is closed at compile time

## Why It Matters

Zig has no `interface`/`trait` keyword. When every implementation of some behavior is known at compile time (you're not loading plugins or storing heterogeneous instances in one collection), a comptime-generic function that simply calls methods on whatever `anytype`/`comptime T` it receives gives you full static dispatch, inlining, and compile-time type checking — with no vtable indirection at runtime.

## Bad

```zig
const std = @import("std");

// A runtime vtable here is pure overhead: every caller passes a
// compile-time-known concrete type, so dynamic dispatch buys nothing.
const Logger = struct {
    ptr: *anyopaque,
    logFn: *const fn (ptr: *anyopaque, msg: []const u8) void,

    fn log(self: Logger, msg: []const u8) void {
        self.logFn(self.ptr, msg);
    }
};
```

## Good

```zig
const std = @import("std");

// Any type with a `log(self, msg: []const u8) void` method satisfies this
// "interface" implicitly — checked at the call site, dispatched statically.
fn runWithLogger(logger: anytype, msg: []const u8) void {
    logger.log(msg);
}

const ConsoleLogger = struct {
    fn log(self: ConsoleLogger, msg: []const u8) void {
        _ = self;
        std.debug.print("[console] {s}\n", .{msg});
    }
};

test "static dispatch via duck typing" {
    const logger = ConsoleLogger{};
    runWithLogger(logger, "hello");
}
```

## When to Switch to a Real Vtable

If callers need to store *different* concrete implementations behind one value at runtime (a plugin registry, a list of mixed logger backends), comptime duck typing can't help — you need the explicit struct-of-function-pointers pattern instead. See `api-vtable-dynamic`.

## See Also

- [api-vtable-dynamic](api-vtable-dynamic.md) - the runtime-polymorphism alternative for heterogeneous collections
- [comptime-anytype-discipline](comptime-anytype-discipline.md) - when `anytype` is the right tool for this pattern
- [api-comptime-interface](api-comptime-interface.md) - the API-design framing of comptime interfaces
