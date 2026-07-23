# comptime-block-compute

> Use `comptime` blocks to compute values once at compile time instead of recomputing at runtime

## Why It Matters

Anything that depends only on compile-time-known inputs — a lookup table, a parsed constant, a derived size — can be computed inside an explicit `comptime { ... }` block or a `comptime`-initialized `const`. The computation runs once during compilation and produces a constant baked into the binary; it costs nothing at runtime, unlike the equivalent lazy-initialization pattern in languages without compile-time execution.

## Bad

```zig
const std = @import("std");

// Recomputed on every call, even though the input never changes.
fn isVowel(c: u8) bool {
    const vowels = "aeiouAEIOU";
    for (vowels) |v| {
        if (c == v) return true;
    }
    return false;
}
```

## Good

```zig
const std = @import("std");

const vowel_table: [256]bool = blk: {
    var table = [_]bool{false} ** 256;
    for ("aeiouAEIOU") |c| table[c] = true;
    break :blk table;
};

fn isVowel(c: u8) bool {
    return vowel_table[c]; // O(1) lookup, table built entirely at compile time
}

test "vowel table" {
    try std.testing.expect(isVowel('a'));
    try std.testing.expect(!isVowel('b'));
}
```

## `comptime` Variables Inside a Block

```zig
const fib_10 = comptime blk: {
    var a: u64 = 0;
    var b: u64 = 1;
    for (0..10) |_| {
        const next = a + b;
        a = b;
        b = next;
    }
    break :blk a;
};
```

## See Also

- [comptime-known-int](comptime-known-int.md) - the untyped compile-time number types used inside these blocks
- [perf-comptime-lookup-table](perf-comptime-lookup-table.md) - the performance framing of precomputed tables
- [comptime-config-validate](comptime-config-validate.md) - validating computed values before using them
