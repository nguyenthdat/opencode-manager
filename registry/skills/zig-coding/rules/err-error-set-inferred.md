# err-error-set-inferred

> Allow inferred error sets for small internal helpers and leaf functions

## Why It Matters

Naming an explicit error set for every private helper is needless ceremony — the inferred set (plain `!T`) already gives full type safety and `try`/`catch` support, and the compiler keeps it in sync automatically as the body changes. Save named sets (`err-error-set-explicit`) for the boundaries callers actually depend on; use inference everywhere the exact error surface is an implementation detail.

## Bad

```zig
const std = @import("std");

// Over-engineered for a three-line private helper nobody outside this file calls.
const TrimError = error{};
fn trimLeadingZeros(input: []const u8) TrimError![]const u8 {
    var i: usize = 0;
    while (i < input.len and input[i] == '0') : (i += 1) {}
    return input[i..];
}
```

## Good

```zig
const std = @import("std");

// Private helper: inferred error set, no ceremony.
fn parseHexByte(input: []const u8) !u8 {
    return std.fmt.parseInt(u8, input, 16);
}

// Called from a public function with its own explicit, stable error set.
pub const DecodeError = error{ InvalidHex, OddLength };

pub fn decodeHex(allocator: std.mem.Allocator, input: []const u8) DecodeError![]u8 {
    if (input.len % 2 != 0) return error.OddLength;
    const out = allocator.alloc(u8, input.len / 2) catch return error.InvalidHex;
    var i: usize = 0;
    while (i < out.len) : (i += 1) {
        out[i] = parseHexByte(input[i * 2 .. i * 2 + 2]) catch return error.InvalidHex;
    }
    return out;
}
```

## Rule of Thumb

If a function is `pub` and part of a library's contract, name its error set. If it's private (no `pub`) and only called from a handful of known sites within the same file or module, inference keeps the code proportionate to its actual stakes.

## See Also

- [err-error-set-explicit](err-error-set-explicit.md) - when to graduate to a named set instead
- [err-error-union-return](err-error-union-return.md) - the `!T` shape both forms share
- [proj-pub-visibility](proj-pub-visibility.md) - deciding what's `pub` in the first place
