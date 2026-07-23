# api-vtable-dynamic

> Use an explicit struct-of-function-pointers vtable for genuine runtime polymorphism

## Why It Matters

When callers need to store *different* concrete implementations behind one value at runtime — a plugin system, a list of mixed logger backends, an interface loaded from a dynamic library — comptime duck typing (`comptime-duck-interface`) can't help, because there's no single compile-time-known type. Zig's idiomatic answer, used throughout the standard library (`std.mem.Allocator` itself is exactly this pattern), is an explicit vtable: an opaque pointer plus a struct of function pointers operating on it.

## Bad

```zig
const std = @import("std");

// Trying to force compile-time generics to hold a heterogeneous runtime
// collection doesn't work: different `T`s produce different, incompatible
// instantiated types, so they can't share one slice.
fn LoggerList(comptime T: type) type {
    return std.ArrayList(T); // only ever holds one concrete logger type
}
```

## Good

```zig
const std = @import("std");

pub const Logger = struct {
    ptr: *anyopaque,
    logFn: *const fn (ptr: *anyopaque, msg: []const u8) void,

    pub fn log(self: Logger, msg: []const u8) void {
        self.logFn(self.ptr, msg);
    }
};

const ConsoleLogger = struct {
    prefix: []const u8,

    fn logImpl(ptr: *anyopaque, msg: []const u8) void {
        const self: *ConsoleLogger = @ptrCast(@alignCast(ptr));
        std.debug.print("{s}{s}\n", .{ self.prefix, msg });
    }

    pub fn logger(self: *ConsoleLogger) Logger {
        return .{ .ptr = self, .logFn = logImpl };
    }
};

test "runtime-polymorphic logger vtable" {
    var console = ConsoleLogger{ .prefix = "[app] " };
    const loggers = [_]Logger{console.logger()};
    for (loggers) |l| l.log("started");
}
```

## This Is Exactly How `std.mem.Allocator` Works

`std.mem.Allocator` is itself a `ptr` + vtable pair (`vtable: *const VTable` with `alloc`/`resize`/`free` function pointers) — studying its source is the canonical example of this pattern done well.

## See Also

- [comptime-duck-interface](comptime-duck-interface.md) - the static-dispatch alternative when the type set is closed
- [interop-opaque-type](interop-opaque-type.md) - `anyopaque`'s FFI counterpart, `opaque {}`
- [alloc-explicit-param](alloc-explicit-param.md) - the standard library's own use of this exact vtable pattern
