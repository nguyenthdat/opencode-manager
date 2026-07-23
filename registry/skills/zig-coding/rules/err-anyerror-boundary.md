# err-anyerror-boundary

> Reserve `anyerror` for true top-level or genuinely open-ended boundaries, not library APIs

## Why It Matters

`anyerror` is the set of *every* error tag defined anywhere in the program being compiled — it's Zig's escape hatch for cases where the exact error set truly cannot be known in advance, such as `main`'s return type or a plugin/callback interface that must accept arbitrary caller-defined errors. Used as a default for ordinary library functions, it throws away the precision that makes error unions useful in the first place.

## Bad

```zig
const std = @import("std");

// A parsing library function has a perfectly enumerable set of failure
// modes — anyerror hides them from every caller.
pub fn parse(allocator: std.mem.Allocator, input: []const u8) anyerror!Ast {
    _ = allocator;
    _ = input;
    return error.InvalidSyntax;
}
```

## Good

```zig
const std = @import("std");

pub const ParseError = error{ InvalidSyntax, UnexpectedEof, OutOfMemory };

pub fn parse(allocator: std.mem.Allocator, input: []const u8) ParseError!Ast {
    _ = allocator;
    _ = input;
    return error.InvalidSyntax;
}

// Legitimate anyerror: `main` is a genuine top-level boundary, and the
// runtime already special-cases its return type for reporting.
pub fn main() anyerror!void {
    _ = try parse(std.heap.page_allocator, "");
}

// Legitimate anyerror: a callback type that must accept whatever error
// set the *caller's* callback happens to produce.
const Callback = *const fn () anyerror!void;
```

## The Test: "Could I Enumerate This?"

If you can name the failure modes (even a long list), name them. If the function's whole purpose is to run caller-supplied code whose errors you can't predict, `anyerror` is the honest signature — don't pretend otherwise with a narrower set that will just get `catch unreachable`d around it later.

## See Also

- [err-merge-error-sets](err-merge-error-sets.md) - composing precise sets instead of widening to `anyerror`
- [err-error-set-explicit](err-error-set-explicit.md) - the default choice for public API boundaries
- [api-vtable-dynamic](api-vtable-dynamic.md) - callback/vtable interfaces where `anyerror` is often appropriate
