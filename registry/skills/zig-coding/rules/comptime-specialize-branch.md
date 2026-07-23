# comptime-specialize-branch

> Use `if (comptime ...)` to specialize code paths per type or configuration without runtime cost

## Why It Matters

A `comptime`-evaluated condition inside a function body is resolved during compilation — only the taken branch is compiled into that instantiation, and the untaken branch doesn't even need to type-check against the current specialization. This lets one generic function have meaningfully different behavior (or avoid code that wouldn't compile for some `T`) per instantiation, with zero runtime branching cost.

## Bad

```zig
const std = @import("std");

// A runtime check here still pays a branch (and, worse, both arms must
// type-check for every T, even when clearly irrelevant to it).
fn describe(comptime T: type, value: T) []const u8 {
    const is_signed = std.meta.trait.isSignedInt(T); // hypothetical runtime call
    if (is_signed) return "signed" else return "unsigned";
}
```

## Good

```zig
const std = @import("std");

fn describe(comptime T: type, value: T) []const u8 {
    _ = value;
    // Resolved entirely at compile time — no branch exists in the compiled
    // output; each instantiation contains only the string it needs.
    if (comptime @typeInfo(T).int.signedness == .signed) {
        return "signed";
    } else {
        return "unsigned";
    }
}

test "compile-time specialization" {
    try std.testing.expectEqualStrings("signed", describe(i32, -1));
    try std.testing.expectEqualStrings("unsigned", describe(u32, 1));
}
```

## Specializing Away Unreachable Code Entirely

```zig
fn clampToRange(comptime T: type, value: T, min: T, max: T) T {
    if (comptime @typeInfo(T) == .float) {
        return @max(min, @min(max, value)); // uses float-safe max/min
    } else {
        return std.math.clamp(value, min, max);
    }
}
```

## See Also

- [comptime-typeinfo-reflect](comptime-typeinfo-reflect.md) - the reflection used to drive these branches
- [comptime-generic-param](comptime-generic-param.md) - the generic parameters being specialized over
- [perf-avoid-anytype-cost](perf-avoid-anytype-cost.md) - keeping specialization from ballooning binary size
