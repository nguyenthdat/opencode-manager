# api-self-value-vs-ptr

> Choose `self: Self` vs `self: *Self` deliberately, based on whether the method mutates

## Why It Matters

A method that only reads a struct's fields should take `self` by value (or `self: *const Self` for large structs to avoid a copy) — this documents that the call cannot affect the caller's copy. A method that mutates fields must take `self: *Self`, making the mutation visible at every call site (`instance.method()` on a `var` is required; it won't compile on a `const`). This split is Zig's substitute for `&self`/`&mut self`/no-self distinctions in other languages.

## Bad

```zig
const std = @import("std");

const Counter = struct {
    value: u32 = 0,

    // Takes self by value, so `self.value += 1` mutates a *copy* — the
    // caller's Counter is silently left unchanged. A likely bug, not a choice.
    fn increment(self: Counter) void {
        var copy = self;
        copy.value += 1;
        // copy is discarded here — the caller sees no change.
    }
};
```

## Good

```zig
const std = @import("std");

const Counter = struct {
    value: u32 = 0,

    // Read-only: value receiver, cheap for small structs.
    pub fn get(self: Counter) u32 {
        return self.value;
    }

    // Mutating: pointer receiver, required to affect the caller's instance.
    pub fn increment(self: *Counter) void {
        self.value += 1;
    }
};

test "value vs pointer receiver" {
    var counter = Counter{};
    counter.increment();
    try std.testing.expectEqual(@as(u32, 1), counter.get());
}
```

## Large Structs: Prefer `*const Self` Even When Read-Only

For a struct large enough that copying it is itself a cost (many fields, embedded arrays), take `self: *const Self` instead of `self: Self` for read-only methods — same immutability guarantee, without the copy:

```zig
const LargeConfig = struct {
    settings: [64]u8 = undefined,

    pub fn checksum(self: *const LargeConfig) u32 {
        return std.hash.Crc32.hash(&self.settings);
    }
};
```

## See Also

- [api-struct-methods](api-struct-methods.md) - the method convention this rule refines
- [api-public-fields-vs-methods](api-public-fields-vs-methods.md) - deciding whether to expose fields directly at all
- [own-move-large](../rust-coding/rules/own-move-large.md) - the analogous Rust concern about copying large values
