# name-underscore-unused

> Use `_ = x;` to discard an intentionally-unused value or parameter

## Why It Matters

Zig treats unused local variables and unused function parameters as compile errors by default — a strong signal that catches typos and dead code, but one that needs an escape hatch for cases where a value is genuinely not needed (an interface requires a parameter you don't use, a return value you're deliberately ignoring). `_ = x;` is that escape hatch: explicit, greppable, and impossible to trigger by accident.

## Bad

```zig
const std = @import("std");

// Assigning to a throwaway variable name doesn't actually satisfy the
// "used" requirement the way `_ = x;` does, and reads as if `unused` might
// matter later.
fn callback(event: Event) void {
    const unused = event;
    _ = unused; // roundabout — just discard `event` directly
}

const Event = struct { id: u32 };
```

## Good

```zig
const std = @import("std");

fn callback(event: Event) void {
    _ = event; // clearly, deliberately unused — required by a callback signature
}

const Event = struct { id: u32 };

fn ignoreResult() void {
    const result = computeSomething();
    _ = result; // deliberately discarding a value that must be produced but isn't needed
}

fn computeSomething() u32 {
    return 42;
}
```

## Discarding an Error Union Explicitly

`_ = try expr;` still requires handling the error (via `try`/`catch`); use it when you need the side effect of a call but not its success value:

```zig
fn logAndContinue(path: []const u8) void {
    _ = std.fs.cwd().deleteFile(path) catch {}; // deliberately ignore deletion failure
}
```

## See Also

- [opt-labeled-block-value](opt-labeled-block-value.md) - producing values deliberately, the complementary concern
- [err-catch-handle](err-catch-handle.md) - handling (rather than discarding) an error union's failure case
- [anti-ignore-error-union](anti-ignore-error-union.md) - the anti-pattern of discarding errors carelessly, not deliberately
