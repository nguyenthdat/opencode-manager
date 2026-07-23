# slice-concat-alloc

> Build strings/slices with `std.mem.concat`, `std.fmt.allocPrint`, or a writer — always with an explicit allocator

## Why It Matters

There's no `+` operator for slices in Zig (see `api-no-hidden-control-flow` on the absence of operator overloading) — concatenation and formatting are ordinary function calls that take an allocator and return an owned, freeable slice. This keeps every allocation visible at the call site instead of hiding it behind an innocuous-looking `+`.

## Bad

```zig
const std = @import("std");

// This does not compile — and reaching for unsafe pointer tricks to fake
// concatenation instead of calling the allocator-aware helper is the wrong direction.
fn greeting(name: []const u8) []const u8 {
    return "Hello, " + name + "!"; // no operator overloading exists for this
}
```

## Good

```zig
const std = @import("std");

fn greeting(allocator: std.mem.Allocator, name: []const u8) ![]u8 {
    return std.fmt.allocPrint(allocator, "Hello, {s}!", .{name});
}

fn joinWords(allocator: std.mem.Allocator, words: []const []const u8) ![]u8 {
    return std.mem.join(allocator, " ", words);
}

test "explicit allocation for string building" {
    const msg = try greeting(std.testing.allocator, "alice");
    defer std.testing.allocator.free(msg);
    try std.testing.expectEqualStrings("Hello, alice!", msg);
}
```

## Building Incrementally: Prefer a Writer Over Repeated Concatenation

For building a string piece-by-piece in a loop, use an `ArrayList(u8)`'s writer instead of repeated `concat`/`allocPrint` calls — see `anti-string-concat-loop` for why repeated concatenation is costly:

```zig
fn buildCsv(allocator: std.mem.Allocator, rows: []const []const u8) ![]u8 {
    var out = std.ArrayList(u8).init(allocator);
    errdefer out.deinit();
    for (rows, 0..) |row, i| {
        if (i != 0) try out.appendSlice(",");
        try out.appendSlice(row);
    }
    return out.toOwnedSlice();
}
```

## See Also

- [slice-string-as-u8](slice-string-as-u8.md) - the underlying representation being built here
- [anti-string-concat-loop](anti-string-concat-loop.md) - the performance trap of repeated allocation in a loop
- [alloc-explicit-param](alloc-explicit-param.md) - the allocator convention these helpers follow
