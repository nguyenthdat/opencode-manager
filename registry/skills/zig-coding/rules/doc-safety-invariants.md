# doc-safety-invariants

> Document invariants that, if violated, trigger undefined behavior — especially around `unreachable` and safety-disabled code

## Why It Matters

`unreachable`, `@setRuntimeSafety(false)`, raw pointer arithmetic, and `@ptrCast` all rely on invariants the compiler cannot check for you. Documenting exactly what must be true before calling such code (or before relying on such a construct) is the only way a future maintainer — including you, months later — can verify a change hasn't quietly invalidated the invariant the unsafe operation depends on.

## Bad

```zig
const std = @import("std");

// No indication of what guarantees this relies on — a caller has no way
// to know what "safe usage" even means here.
pub fn fastSum(items: []const i32) i32 {
    @setRuntimeSafety(false);
    var total: i32 = 0;
    for (items) |item| total += item;
    return total;
}
```

## Good

```zig
const std = @import("std");

/// Sums `items` without overflow checking.
///
/// Safety: the caller must guarantee the sum fits in `i32` without
/// overflowing; this is intended only for hot paths where the value
/// range has already been validated upstream (see `validateRange`).
pub fn fastSum(items: []const i32) i32 {
    @setRuntimeSafety(false);
    var total: i32 = 0;
    for (items) |item| total += item;
    return total;
}

fn validateRange(items: []const i32) bool {
    var total: i64 = 0;
    for (items) |item| total += item;
    return total >= std.math.minInt(i32) and total <= std.math.maxInt(i32);
}
```

## See Also

- [lint-avoid-suppress-safety](lint-avoid-suppress-safety.md) - the broader rule about disabling safety checks at all
- [err-no-unreachable-recoverable](err-no-unreachable-recoverable.md) - the invariant `unreachable` itself always requires
- [doc-doc-comment-slash3](doc-doc-comment-slash3.md) - the doc-comment mechanism used to state these invariants
