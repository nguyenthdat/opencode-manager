# opt-if-capture

> Use `if (optional) |value| { ... }` to safely unwrap and use an optional's payload

## Why It Matters

`if (x) |value|` is Zig's primary optional-unwrapping construct with a real branch for the non-null case: inside the block, `value` has type `T` (not `?T`), guaranteed non-null by the compiler — there is no way to accidentally use the optional itself where a `T` was expected. Add an `else` for the `null` branch, or omit it when there's nothing to do.

## Bad

```zig
const std = @import("std");

// Forcing the value out with `.?` re-introduces exactly the risk optionals
// exist to prevent — a runtime panic if the check above didn't hold.
fn greet(name: ?[]const u8) void {
    if (name != null) {
        std.debug.print("Hello, {s}!\n", .{name.?});
    }
}
```

## Good

```zig
const std = @import("std");

fn greet(name: ?[]const u8) void {
    if (name) |n| {
        std.debug.print("Hello, {s}!\n", .{n});
    } else {
        std.debug.print("Hello, stranger!\n", .{});
    }
}
```

## Capturing by Pointer to Mutate in Place

`if (optional) |*value|` captures a pointer to the field/variable itself, letting you mutate the wrapped value without re-assigning the whole optional:

```zig
const Counter = struct { value: ?u32 };

fn increment(counter: *Counter) void {
    if (counter.value) |*v| {
        v.* += 1;
    } else {
        counter.value = 1;
    }
}
```

## See Also

- [opt-orelse-default](opt-orelse-default.md) - the fallback-only alternative when you don't need both branches
- [opt-while-capture](opt-while-capture.md) - the loop form of the same capture syntax
- [opt-avoid-force-unwrap](opt-avoid-force-unwrap.md) - why `.?` should be rare compared to this form
