# api-no-hidden-control-flow

> Avoid hidden control flow: Zig has no exceptions and no operator overloading, so keep it that way in spirit

## Why It Matters

A `+` in Zig always means integer/float addition — never a user-overloaded operation that might allocate, lock a mutex, or throw. A function call never secretly unwinds the stack the way a thrown exception would. This absence of "surprising" behavior is a deliberate language design choice; API design should preserve it by avoiding patterns that reintroduce hidden behavior through the back door (macros pretending to be operators, callback-heavy designs that obscure control flow, `catch unreachable` masking real failure as success).

## Bad

```zig
const std = @import("std");

// A callback-based "fluent" API where reading the call site tells you
// nothing about what actually happens, how many times, or in what order.
fn onEvent(handler: *const fn () void) void {
    handler();
    handler(); // called twice — not obvious from any call site
}
```

## Good

```zig
const std = @import("std");

// Explicit, linear control flow: the caller can read exactly what happens.
fn processEvents(events: []const Event, handler: *const fn (Event) void) void {
    for (events) |event| handler(event);
}

const Event = struct { id: u32 };

test "explicit iteration, no hidden repetition" {
    const events = [_]Event{ .{ .id = 1 }, .{ .id = 2 } };
    var count: u32 = 0;
    processEvents(&events, struct {
        fn handle(_: Event) void {}
    }.handle);
    _ = count;
}
```

## No Operator Overloading Means No Surprise Allocations in Expressions

Because `a + b` can never secretly call user code, an expression's cost is always visible from its shape — a function call might allocate, but a `+`, `==`, or array index never will. Preserve this by not building APIs (via macros, code generation, or convention) that make plain-looking expressions do surprising work.

## See Also

- [api-explicit-fallibility](api-explicit-fallibility.md) - the fallibility half of this same honesty principle
- [alloc-avoid-hidden](alloc-avoid-hidden.md) - the allocation half of this same honesty principle
- [opt-labeled-break](opt-labeled-break.md) - explicit structured control flow as the alternative to flag variables
