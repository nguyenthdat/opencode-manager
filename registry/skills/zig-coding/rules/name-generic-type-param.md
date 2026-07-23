# name-generic-type-param

> Name `comptime` type parameters descriptively (`Context`, `Handler`) rather than defaulting to a bare single letter everywhere

## Why It Matters

A single-letter type parameter like `T` is fine, and idiomatic, when a generic function or container genuinely operates on "any type" with no further meaning (`Stack(T)`, `max(T, a, b)`) — that's how the standard library itself names most container element types. But once a function takes several `comptime` type parameters with distinct roles, or a type parameter represents something more specific than "the element type," a descriptive name communicates its role far better than `T`, `U`, `V` in sequence.

## Bad

```zig
const std = @import("std");

// Three single-letter type parameters with no indication of what each is for.
fn dispatch(comptime T: type, comptime U: type, comptime V: type, input: T) U {
    _ = V;
    _ = input;
    unreachable;
}
```

## Good

```zig
const std = @import("std");

// A single, genuinely generic element type: T is fine and idiomatic.
fn Stack(comptime T: type) type {
    return struct { items: std.ArrayListUnmanaged(T) = .{} };
}

// Multiple type parameters with distinct roles: name them for their role.
fn handleRequest(comptime Request: type, comptime Response: type, comptime Context: type, req: Request, ctx: Context) Response {
    _ = req;
    _ = ctx;
    unreachable;
}
```

## Rule of Thumb

One type parameter, purely generic over "the element/value type": `T` is idiomatic (matches `std.ArrayList(T)`, `std.AutoHashMap(K, V)`). Multiple type parameters, or a parameter with a specific conceptual role beyond "the type": name it for that role.

## See Also

- [comptime-generic-param](comptime-generic-param.md) - the mechanism these names are attached to
- [comptime-generic-struct](comptime-generic-struct.md) - generic containers, the most common home for `T`
- [name-types-titlecase](name-types-titlecase.md) - the casing convention type parameter names follow
