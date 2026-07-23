# test-builtin-test-block

> Use built-in `test` blocks colocated with the code they exercise

## Why It Matters

Zig's `test "name" { ... }` is a first-class language construct, not a separate framework — `zig test file.zig` (or `zig build test`) collects every `test` block reachable from the given root and runs them. Keeping tests in the same file as the code they exercise (rather than a separate test-only file, unless the project has a strong convention otherwise) keeps them visible to anyone reading or editing the implementation.

## Bad

```zig
// math.zig — implementation with no visible tests at all; correctness is
// only ever checked manually or via some external, disconnected process.
const std = @import("std");

pub fn clampPercent(value: f64) f64 {
    return std.math.clamp(value, 0.0, 100.0);
}
```

## Good

```zig
// math.zig
const std = @import("std");

pub fn clampPercent(value: f64) f64 {
    return std.math.clamp(value, 0.0, 100.0);
}

test "clampPercent clamps values below zero" {
    try std.testing.expectEqual(@as(f64, 0.0), clampPercent(-10.0));
}

test "clampPercent clamps values above one hundred" {
    try std.testing.expectEqual(@as(f64, 100.0), clampPercent(150.0));
}

test "clampPercent passes through in-range values" {
    try std.testing.expectEqual(@as(f64, 42.0), clampPercent(42.0));
}
```

## Running

```sh
zig test math.zig
# or, via a project's build.zig test step:
zig build test
```

## See Also

- [test-zig-test-command](test-zig-test-command.md) - wiring this into CI via `zig build test`
- [name-test-description](name-test-description.md) - naming these test blocks descriptively
- [test-refAllDecls](test-refAllDecls.md) - making sure nested/imported tests are actually discovered
