# opt-labeled-block-value

> Use a labeled block to compute and `break` out a value, instead of a mutable "result" variable

## Why It Matters

A labeled block (`blk: { ... }`) can `break :blk value` to produce a value as if the whole block were an expression — useful for multi-step or branching computation that ultimately resolves to one value, without declaring an outer `var` just to be assigned from inside nested conditionals.

## Bad

```zig
const std = @import("std");

fn classify(score: u32) []const u8 {
    var label: []const u8 = undefined; // mutable var that exists only to be set once
    if (score >= 90) {
        label = "excellent";
    } else if (score >= 70) {
        label = "good";
    } else {
        label = "needs improvement";
    }
    return label;
}
```

## Good

```zig
const std = @import("std");

fn classify(score: u32) []const u8 {
    const label = blk: {
        if (score >= 90) break :blk "excellent";
        if (score >= 70) break :blk "good";
        break :blk "needs improvement";
    };
    return label;
}

test "labeled block value" {
    try std.testing.expectEqualStrings("good", classify(75));
}
```

## Producing a Value From a Loop

A labeled loop can also `break :label value`, useful for search-then-use patterns:

```zig
fn firstMatchOrDefault(items: []const i32, predicate: fn (i32) bool) i32 {
    const found = search: {
        for (items) |item| {
            if (predicate(item)) break :search item;
        }
        break :search -1;
    };
    return found;
}
```

## See Also

- [opt-labeled-break](opt-labeled-break.md) - the plain control-flow (non-value) form of labeled blocks
- [api-explicit-fallibility](api-explicit-fallibility.md) - keeping computation paths easy to follow, which this pattern supports
- [name-underscore-unused](name-underscore-unused.md) - discarding values you deliberately don't use
