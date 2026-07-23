# anti-catch-unreachable-abuse

> Don't use `catch unreachable` on an operation that can genuinely fail

## Why It Matters

`catch unreachable` asserts, to the compiler and to every future reader, that the error branch is provably impossible right here. Using it as a shortcut to avoid handling a real, reachable failure (parsing user input, a network call, a file read) turns an ordinary, expected error into an unrecoverable crash the moment that "impossible" case actually happens — which, for genuinely fallible operations, it eventually will.

## Bad

```zig
const std = @import("std");

fn parsePort(user_input: []const u8) u16 {
    // User input can absolutely fail to parse — this is not unreachable,
    // it's a crash waiting for the first malformed request.
    return std.fmt.parseInt(u16, user_input, 10) catch unreachable;
}
```

## Good

```zig
const std = @import("std");

fn parsePort(user_input: []const u8) !u16 {
    return std.fmt.parseInt(u16, user_input, 10);
}

// `catch unreachable` is fine only when the input is provably fixed and
// valid at compile time, not merely "usually" valid at runtime.
fn defaultPort() u16 {
    return std.fmt.parseInt(u16, "8080", 10) catch unreachable; // literal, known-valid
}
```

## See Also

- [err-no-unreachable-recoverable](err-no-unreachable-recoverable.md) - the full rule this anti-pattern violates
- [err-catch-handle](err-catch-handle.md) - handling the error properly instead of asserting it away
- [anti-panic-for-recoverable](anti-panic-for-recoverable.md) - the closely related `@panic` version of this same mistake
