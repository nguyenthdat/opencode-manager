# api-public-fields-vs-methods

> Decide between public struct fields and accessor methods based on whether an invariant must be preserved

## Why It Matters

Zig structs default to plain public fields — there's no `private`/`public` field-level keyword inside a struct's own file, only `pub` at the declaration level controlling cross-file visibility. When a type has no invariant to protect (a simple data bag like a `Point`), exposing fields directly is idiomatic and adds no risk. When a type must maintain an invariant across its fields (a `len` that must match an internal buffer's used portion, a cached value derived from other fields), expose methods instead and keep the fields themselves un-exported or clearly marked "do not mutate directly."

## Bad

```zig
const std = @import("std");

// `len` and `capacity` must stay consistent with the actual buffer contents,
// but nothing stops external code from setting `len` to an invalid value.
pub const Buffer = struct {
    data: []u8,
    len: usize,
    capacity: usize,
};
```

## Good

```zig
const std = @import("std");

pub const Buffer = struct {
    data: []u8,
    len: usize = 0, // internal bookkeeping — documented as "read via len(), don't set directly"

    pub fn len_(self: Buffer) usize {
        return self.len;
    }

    pub fn append(self: *Buffer, byte: u8) !void {
        if (self.len >= self.data.len) return error.BufferFull;
        self.data[self.len] = byte;
        self.len += 1; // the only place this invariant is updated
    }
};

// A plain data bag with no invariant to protect: fields are simply public.
pub const Point = struct {
    x: f64,
    y: f64,
};
```

## Rule of Thumb

Ask: "if external code set this field directly to any value of the right type, could that break something?" If no, a public field is simplest and most idiomatic. If yes, route mutation through a method that maintains the invariant.

## See Also

- [api-struct-methods](api-struct-methods.md) - the method mechanism used to guard invariants
- [api-init-deinit-convention](api-init-deinit-convention.md) - construction as the first place invariants are established
- [proj-pub-visibility](proj-pub-visibility.md) - file-level visibility, the complementary access-control mechanism
