# opt-while-capture

> Use `while (iter.next()) |item| { ... }` for iterator-style loops driven by optionals

## Why It Matters

Many Zig standard library iterators expose a `next() ?T` method, and the idiomatic way to drive them is a `while` loop that captures the optional's payload directly in the loop condition — the loop naturally terminates the moment `next()` returns `null`, with no separate "has more" check and no risk of forgetting to advance the iterator.

## Bad

```zig
const std = @import("std");

fn countWords(text: []const u8) usize {
    var iter = std.mem.tokenizeScalar(u8, text, ' ');
    var count: usize = 0;
    // Calling next() twice per iteration (once to check, once to use) is
    // redundant and error-prone if the two calls ever drift out of sync.
    while (true) {
        const maybe_word = iter.next();
        if (maybe_word == null) break;
        count += 1;
    }
    return count;
}
```

## Good

```zig
const std = @import("std");

fn countWords(text: []const u8) usize {
    var iter = std.mem.tokenizeScalar(u8, text, ' ');
    var count: usize = 0;
    while (iter.next()) |_| {
        count += 1;
    }
    return count;
}

test "word count via while-capture" {
    try std.testing.expectEqual(@as(usize, 3), countWords("the quick fox"));
}
```

## Using the Captured Value

```zig
fn sumLineLengths(text: []const u8) usize {
    var lines = std.mem.splitScalar(u8, text, '\n');
    var total: usize = 0;
    while (lines.next()) |line| {
        total += line.len;
    }
    return total;
}
```

## See Also

- [opt-if-capture](opt-if-capture.md) - the single-shot (non-looping) form of this same capture syntax
- [slice-iterate-native](slice-iterate-native.md) - the plain `for` form for iterating slices directly
- [opt-labeled-break](opt-labeled-break.md) - breaking out of nested `while` loops cleanly
