# doc-params-return

> Document non-obvious parameters, return values, and side effects — skip ceremony for self-explanatory ones

## Why It Matters

Not every function needs exhaustive parameter-by-parameter documentation — `fn add(a: i32, b: i32) i32` needs none. But a parameter with units, a non-obvious valid range, an ordering requirement relative to another parameter, or a side effect not visible in the signature (writes a file, mutates global state, blocks) all deserve a note, because a caller cannot infer them from the type alone.

## Bad

```zig
const std = @import("std");

/// Sets the timeout.
pub fn setTimeout(ms: u32, retries: u8) void {
    _ = ms;
    _ = retries;
}
// Is `ms` milliseconds or something else? Does `retries` apply per attempt
// or total? Nothing here says.
```

## Good

```zig
const std = @import("std");

/// Configures the connection timeout.
///
/// `ms` is the per-attempt timeout in milliseconds; `retries` is the
/// number of additional attempts after the first failure (0 disables
/// retrying). Calling this after a connection is already established has
/// no effect until the next reconnect attempt.
pub fn setTimeout(ms: u32, retries: u8) void {
    _ = ms;
    _ = retries;
}
```

## Skip the Ceremony for Genuinely Obvious Cases

```zig
/// Returns the larger of two values.
pub fn max(a: i32, b: i32) i32 {
    return if (a > b) a else b;
}
```

## See Also

- [doc-doc-comment-slash3](doc-doc-comment-slash3.md) - the doc-comment mechanism these details live in
- [doc-allocator-ownership](doc-allocator-ownership.md) - a specific, high-value category of non-obvious contract
- [doc-error-set-document](doc-error-set-document.md) - documenting failure behavior specifically
