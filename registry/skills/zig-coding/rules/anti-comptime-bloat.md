# anti-comptime-bloat

> Don't let unchecked generic instantiation quietly balloon compile times and binary size

## Why It Matters

Each distinct set of `comptime` arguments to a generic function or type produces its own full instantiation. A codebase that instantiates the same generic dozens of times over near-identical types — without ever noticing — pays for it in slow incremental builds and a larger-than-necessary binary, with no corresponding runtime benefit since most of those instantiations share almost all their logic.

## Bad

```zig
const std = @import("std");

fn Handler(comptime EventType: type) type {
    return struct {
        pub fn handle(event: EventType) void {
            // ... substantial, mostly type-independent dispatch logic ...
            _ = event;
        }
    };
}

// Instantiated once per distinct event struct used anywhere in the
// program, even though `handle`'s logic barely depends on the type.
const ClickHandler = Handler(ClickEvent);
const KeyHandler = Handler(KeyEvent);
const ResizeHandler = Handler(ResizeEvent);
const ScrollHandler = Handler(ScrollEvent);
const FocusHandler = Handler(FocusEvent);

const ClickEvent = struct {};
const KeyEvent = struct {};
const ResizeEvent = struct {};
const ScrollEvent = struct {};
const FocusEvent = struct {};
```

## Good

```zig
const std = @import("std");

const Event = union(enum) {
    click: ClickEvent,
    key: KeyEvent,
    resize: ResizeEvent,
};

const ClickEvent = struct {};
const KeyEvent = struct {};
const ResizeEvent = struct {};

// One non-generic function, dispatching on a tagged union instead of
// instantiating a whole generic type per event kind.
fn handle(event: Event) void {
    switch (event) {
        .click, .key, .resize => {}, // shared dispatch logic, one compiled copy
    }
}
```

## See Also

- [comptime-avoid-bloat](comptime-avoid-bloat.md) - the full rule this anti-pattern violates
- [api-tagged-union-variants](api-tagged-union-variants.md) - the tagged-union alternative used above
- [perf-avoid-anytype-cost](perf-avoid-anytype-cost.md) - the closely related `anytype` version of this same problem
