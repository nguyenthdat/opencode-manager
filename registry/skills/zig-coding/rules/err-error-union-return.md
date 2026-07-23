# err-error-union-return

> Return an error union (`!T`) as the default shape for any fallible operation

## Why It Matters

Zig has no exceptions. A function that can fail says so in its return type — `ErrorSet!T` or the inferred `!T` — and the compiler forces every caller to acknowledge that with `try`, `catch`, or a `switch`. This makes failure paths part of the type system instead of an implicit, easy-to-forget possibility.

## Bad

```zig
const std = @import("std");

// Returning a sentinel value conflates "zero" with "failed" and callers
// have no compiler-enforced reason to check anything.
fn parseCount(input: []const u8) i64 {
    return std.fmt.parseInt(i64, input, 10) catch -1;
}
```

## Good

```zig
const std = @import("std");

fn parseCount(input: []const u8) !i64 {
    return std.fmt.parseInt(i64, input, 10);
}

pub fn main() !void {
    const count = parseCount("42") catch |err| {
        std.log.err("bad count: {s}", .{@errorName(err)});
        return err;
    };
    std.debug.print("count = {d}\n", .{count});
}
```

## Inferred vs. Explicit Error Sets

`!T` with no error set named is Zig's inferred error set — the compiler computes the exact set of errors the function body can produce. Use it freely for internal/leaf functions; switch to an explicit named set at public API boundaries (see `err-error-set-explicit`) so the contract is documented and stable.

```zig
// Inferred: fine for a small internal helper.
fn double(input: []const u8) !i64 {
    return (try std.fmt.parseInt(i64, input, 10)) * 2;
}

// Explicit: better for a public library function.
const ParseError = error{ InvalidFormat, Overflow };
pub fn parseCount(input: []const u8) ParseError!i64 {
    // ...
}
```

## See Also

- [err-error-set-explicit](err-error-set-explicit.md) - naming stable error sets at API boundaries
- [err-try-propagate](err-try-propagate.md) - the primary way callers consume an error union
- [opt-null-vs-error](opt-null-vs-error.md) - choosing `!T` vs `?T` for a given failure mode
