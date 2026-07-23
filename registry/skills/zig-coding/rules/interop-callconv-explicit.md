# interop-callconv-explicit

> Mark exported/imported functions with an explicit calling convention where the default wouldn't match

## Why It Matters

`export fn` and `extern fn` default to the C calling convention on most targets, but interop with certain platform APIs (Windows' `stdcall`-based Win32 API, interrupt handlers, some embedded/kernel contexts) requires a different, explicitly stated convention via `callconv(...)`. Leaving this implicit works until it silently doesn't — on a target or API where the assumed default is wrong, mismatched calling conventions corrupt the stack in ways that are painful to debug.

## Bad

```zig
const std = @import("std");

// Calling a Win32 API that uses the stdcall convention as if it were a
// plain C function works by accident on some configurations and corrupts
// the stack on others.
extern fn MessageBoxA(hwnd: ?*anyopaque, text: [*:0]const u8, caption: [*:0]const u8, kind: c_uint) c_int;
```

## Good

```zig
const std = @import("std");

extern "user32" fn MessageBoxA(
    hwnd: ?*anyopaque,
    text: [*:0]const u8,
    caption: [*:0]const u8,
    kind: c_uint,
) callconv(.winapi) c_int;

// Exporting a Zig function meant to be called back by such an API also
// needs the matching convention stated explicitly.
fn timerCallback(id: usize) callconv(.winapi) void {
    _ = id;
}
```

## When the Default Is Correct

For ordinary C interop on POSIX-like targets, the default `export fn`/`extern fn` convention already matches C's calling convention — explicit `callconv(.c)` is harmless but not required. State it explicitly specifically when the target's default would otherwise be ambiguous or wrong for the API being called.

## See Also

- [interop-export-c-calling-convention](interop-export-c-calling-convention.md) - the ordinary C-convention case this rule refines
- [interop-c-abi-types](interop-c-abi-types.md) - the type side of matching a foreign ABI correctly
- [proj-cross-compile-targets](proj-cross-compile-targets.md) - target differences that can affect calling convention defaults
