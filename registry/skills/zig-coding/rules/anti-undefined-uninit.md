# anti-undefined-uninit

> Don't leave memory as `undefined` and then read it before it's actually initialized

## Why It Matters

`undefined` is a real Zig value meaning "this memory's contents are whatever garbage happens to already be there" — assigning it is a deliberate opt-out of zero-initialization, useful when you're about to overwrite the memory anyway (e.g. right before a `readAll` fills a buffer). Reading `undefined` memory before writing to it is undefined behavior: the value could be anything, and in `ReleaseFast`/`ReleaseSmall` this can manifest as nondeterministic, hard-to-reproduce bugs.

## Bad

```zig
const std = @import("std");

fn readHeader(file: std.fs.File) !u32 {
    var buf: [4]u8 = undefined;
    // If readAll reads fewer than 4 bytes (short read, EOF), the
    // remaining bytes of `buf` are read here as pure garbage.
    _ = try file.readAll(&buf);
    return std.mem.readInt(u32, &buf, .little);
}
```

## Good

```zig
const std = @import("std");

fn readHeader(file: std.fs.File) !u32 {
    var buf: [4]u8 = undefined;
    const n = try file.readAll(&buf);
    if (n != buf.len) return error.UnexpectedEof; // verify full initialization before reading
    return std.mem.readInt(u32, &buf, .little);
}
```

## `undefined` Is Fine When Immediately, Fully Overwritten

```zig
var scratch: [1024]u8 = undefined; // fine: about to fill it completely below
const n = try file.readAll(scratch[0..1024]);
_ = n;
```

## See Also

- [alloc-fixed-buffer](alloc-fixed-buffer.md) - a common place `undefined` buffers are used correctly
- [err-no-unreachable-recoverable](err-no-unreachable-recoverable.md) - a related discipline around provable invariants
- [doc-safety-invariants](doc-safety-invariants.md) - documenting exactly when `undefined` memory becomes safe to read
