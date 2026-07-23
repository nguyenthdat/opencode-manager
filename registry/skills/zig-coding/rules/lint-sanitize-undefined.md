# lint-sanitize-undefined

> Rely on `Debug`/`ReleaseSafe`'s built-in safety checks instead of disabling them and hoping for the best

## Why It Matters

`Debug` and `ReleaseSafe` builds already catch integer overflow, out-of-bounds access, null-pointer-style optional misuse, and reaching `unreachable` — this is effectively a lightweight, always-on sanitizer built into the language, with no separate tool (like a C/C++ UBSan/ASan) to configure. The discipline this rule asks for is simple: don't reach for `@setRuntimeSafety(false)` or jump straight to `ReleaseFast` as a way to avoid seeing these checks fire; investigate what they're telling you instead.

## Bad

```zig
const std = @import("std");

// A test panics under Debug due to a real overflow bug, and the response
// is to suppress the check rather than fix the underlying issue.
fn computeChecksum(bytes: []const u8) u8 {
    @setRuntimeSafety(false); // "the test kept panicking, so..."
    var sum: u8 = 0;
    for (bytes) |b| sum += b; // wraps silently now, masking a real bug upstream
    return sum;
}
```

## Good

```zig
const std = @import("std");

// Let the safety check do its job: use wrapping arithmetic explicitly
// where wraparound is actually the intended behavior (a checksum), so the
// intent is visible and no genuine overflow bug is hidden elsewhere.
fn computeChecksum(bytes: []const u8) u8 {
    var sum: u8 = 0;
    for (bytes) |b| sum +%= b; // explicit wraparound, not a suppressed check
    return sum;
}

test "checksum uses explicit wrapping arithmetic" {
    try std.testing.expectEqual(@as(u8, 6), computeChecksum(&.{ 1, 2, 3 }));
}
```

## See Also

- [lint-avoid-suppress-safety](lint-avoid-suppress-safety.md) - the general rule against disabling safety checks casually
- [lint-debug-default](lint-debug-default.md) - the build mode that keeps these checks active during development
- [err-no-unreachable-recoverable](err-no-unreachable-recoverable.md) - a related discipline around a specific safety-relevant construct
