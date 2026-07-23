# comptime-anytype-discipline

> Use `anytype` sparingly; prefer a named `comptime T: type` when the constraint matters

## Why It Matters

`anytype` accepts literally any type and defers all validation to how the parameter is used inside the function body — errors surface deep in the implementation, at the use site, with a confusing compile error pointing at the wrong place. A named `comptime T: type` parameter lets you validate constraints up front (via `@typeInfo`, duck-typed checks, or a `comptime` assertion) and produce a clear, early error message.

## Bad

```zig
const std = @import("std");

// Any mistake here surfaces as an obscure error deep inside the function
// body, not at the call site, and there's no stated contract for what
// `writer` needs to support.
fn logValue(writer: anytype, value: i32) !void {
    try writer.print("value = {d}\n", .{value});
}
```

## Good

```zig
const std = @import("std");

// `anytype` is genuinely appropriate here: std.io writers are duck-typed
// by convention (anything with a matching `print`/`writeAll`), and the
// standard library itself uses `anytype` for this exact case.
fn logValue(writer: anytype, value: i32) !void {
    try writer.print("value = {d}\n", .{value});
}

// When the constraint is more specific than "has this one method," name
// the type and validate it explicitly for a clear compile error.
fn sum(comptime T: type, items: []const T) T {
    comptime {
        if (@typeInfo(T) != .int and @typeInfo(T) != .float) {
            @compileError("sum() requires a numeric type, got " ++ @typeName(T));
        }
    }
    var total: T = 0;
    for (items) |item| total += item;
    return total;
}
```

## Rule of Thumb

Use `anytype` for thin, structural, duck-typed parameters (writers, readers, comparators) where the standard library itself favors it. Use a named `comptime T` — with an explicit constraint check — when the function has real requirements on `T` that deserve a clear error message if violated.

## See Also

- [comptime-generic-param](comptime-generic-param.md) - the named-type-parameter alternative to `anytype`
- [comptime-compile-error](comptime-compile-error.md) - producing a clear message when a constraint is violated
- [anti-anytype-overuse](anti-anytype-overuse.md) - the anti-pattern write-up of overusing `anytype`
