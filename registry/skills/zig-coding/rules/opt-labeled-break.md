# opt-labeled-break

> Use labeled blocks and loops for structured control flow instead of boolean flags

## Why It Matters

Zig lets you label any block or loop (`outer: for (...) { ... }`) and `break`/`continue` a specific label directly, including from inside nested loops. This replaces the common pattern of introducing a `found`/`done` boolean flag purely to escape multiple levels of nesting, keeping intent explicit and removing a variable that exists only to carry control-flow state.

## Bad

```zig
const std = @import("std");

fn findPair(matrix: []const []const i32, target: i32) ?[2]usize {
    var found = false;
    var result: [2]usize = undefined;
    for (matrix, 0..) |row, i| {
        if (found) break;
        for (row, 0..) |value, j| {
            if (value == target) {
                result = .{ i, j };
                found = true;
                break;
            }
        }
    }
    return if (found) result else null;
}
```

## Good

```zig
const std = @import("std");

fn findPair(matrix: []const []const i32, target: i32) ?[2]usize {
    var result: ?[2]usize = null;
    outer: for (matrix, 0..) |row, i| {
        for (row, 0..) |value, j| {
            if (value == target) {
                result = .{ i, j };
                break :outer;
            }
        }
    }
    return result;
}

test "labeled break exits both loops" {
    const matrix = [_][]const i32{ &.{ 1, 2 }, &.{ 3, 4 } };
    try std.testing.expectEqual(@as(?[2]usize, .{ 1, 1 }), findPair(&matrix, 4));
}
```

## Labeled `continue` Skips an Outer Iteration

```zig
fn skipMatchingRows(matrix: []const []const i32, skip_value: i32) void {
    row_loop: for (matrix) |row| {
        for (row) |value| {
            if (value == skip_value) continue :row_loop;
        }
        process(row);
    }
}
fn process(row: []const i32) void { _ = row; }
```

## See Also

- [opt-labeled-block-value](opt-labeled-block-value.md) - producing a value directly from a labeled block
- [opt-if-capture](opt-if-capture.md) - preferring optional capture over flag variables in simpler cases
- [api-no-hidden-control-flow](api-no-hidden-control-flow.md) - the broader principle of explicit, visible control flow
