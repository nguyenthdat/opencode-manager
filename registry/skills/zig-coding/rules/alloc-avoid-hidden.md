# alloc-avoid-hidden

> Make every allocation visible in a function's signature — no allocating side effects behind a "pure-looking" call

## Why It Matters

A function that allocates without taking an `std.mem.Allocator` parameter is not truly allocation-free; it's either calling a global allocator (see `alloc-no-global`) or it isn't actually possible to write in Zig, since there is no ambient allocator. Reviewers and callers should be able to tell, from the signature alone, whether a call can fail with `error.OutOfMemory` and who is responsible for freeing the result.

## Bad

```zig
const std = @import("std");

// Looks like a simple string transform — but where does the memory for the
// return value come from? The signature doesn't say, so it can't say who frees it.
fn shout(input: []const u8) []const u8 {
    // (hypothetical — this would not compile without an allocator in scope,
    // which is precisely the point: Zig forces this to be visible.)
    unreachable;
}
```

## Good

```zig
const std = @import("std");

// The signature tells the whole story: this can fail with OutOfMemory,
// and the caller owns (and must free) the returned slice.
fn shout(allocator: std.mem.Allocator, input: []const u8) ![]u8 {
    const result = try allocator.alloc(u8, input.len);
    for (input, 0..) |c, i| result[i] = std.ascii.toUpper(c);
    return result;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();

    const loud = try shout(gpa.allocator(), "hello");
    defer gpa.allocator().free(loud);
}
```

## Prefer Non-Allocating Signatures When Possible

If a function can be written against a caller-supplied buffer instead of allocating, prefer that — it removes the allocation question entirely:

```zig
// No allocator needed at all: caller supplies (and owns) the destination.
fn shoutInto(dest: []u8, input: []const u8) void {
    for (input, 0..) |c, i| dest[i] = std.ascii.toUpper(c);
}
```

## See Also

- [alloc-explicit-param](alloc-explicit-param.md) - the mechanism that makes allocation visible
- [alloc-no-global](alloc-no-global.md) - the anti-pattern this rule guards against reintroducing
- [api-explicit-fallibility](api-explicit-fallibility.md) - the broader principle of honest function signatures
