# interop-export-c-calling-convention

> Use `export fn` with the C calling convention to expose Zig functions to C callers

## Why It Matters

`export fn` marks a function for external linkage with a stable, C-compatible symbol name and calling convention, making it callable from C, C++, or any other language that can link against a C ABI. Without `export`, a Zig function's name may be mangled or eliminated entirely by the optimizer if nothing in the Zig program appears to call it.

## Bad

```zig
const std = @import("std");

// A plain `pub fn` is visible to other Zig modules, but has no guarantee
// of a stable, unmangled, C-callable symbol for an external C caller.
pub fn add(a: i32, b: i32) i32 {
    return a + b;
}
```

## Good

```zig
const std = @import("std");

export fn add(a: c_int, b: c_int) c_int {
    return a + b;
}

test "exported function still callable from Zig" {
    try std.testing.expectEqual(@as(c_int, 5), add(2, 3));
}
```

```c
/* consumer.c */
extern int add(int a, int b);

int main(void) {
    return add(2, 3) == 5 ? 0 : 1;
}
```

## Building as a C-Linkable Library

```zig
// build.zig (excerpt)
const lib = b.addSharedLibrary(.{
    .name = "mylib",
    .root_source_file = b.path("src/lib.zig"),
    .target = target,
    .optimize = optimize,
});
```

## See Also

- [interop-c-abi-types](interop-c-abi-types.md) - choosing C-ABI-correct parameter/return types for exported functions
- [interop-error-boundary-c](interop-error-boundary-c.md) - translating Zig error unions across this exact boundary
- [interop-extern-struct](interop-extern-struct.md) - passing struct data across the same boundary
