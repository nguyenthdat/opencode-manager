# test-fuzz-input

> Use built-in fuzz testing support for parsers and other functions with adversarial, unstructured input

## Why It Matters

Recent Zig toolchains include built-in fuzzing support (`zig build test --fuzz`) that generates and mutates input to a designated `test` function, hunting for crashes, panics, and memory-safety violations that hand-written example-based tests wouldn't think to try. This is especially valuable for parsers, deserializers, and anything else that consumes untrusted bytes — exactly the surface where a single malformed input can crash a program `unwrap`/`.?`-style.

## Bad

```zig
const std = @import("std");

// Only the "happy path" and a couple of obvious edge cases are tested —
// no coverage for the vast space of malformed/adversarial byte sequences
// a real parser will eventually see in production.
test "parses a valid header" {
    const result = try parseHeader("Content-Length: 42");
    try std.testing.expectEqual(@as(u32, 42), result);
}

fn parseHeader(input: []const u8) !u32 {
    const idx = std.mem.indexOf(u8, input, ": ") orelse return error.InvalidHeader;
    return std.fmt.parseInt(u32, input[idx + 2 ..], 10);
}
```

## Good

```zig
const std = @import("std");

test "parseHeader never crashes on arbitrary input" {
    const input = std.testing.fuzzInput(.{});
    // Any input the fuzzer generates must return normally (a value or an
    // error) — never panic, never trigger undefined behavior.
    _ = parseHeader(input) catch {};
}

fn parseHeader(input: []const u8) !u32 {
    const idx = std.mem.indexOf(u8, input, ": ") orelse return error.InvalidHeader;
    return std.fmt.parseInt(u32, input[idx + 2 ..], 10);
}
```

```sh
zig build test --fuzz
```

Verify the exact fuzzing API (`std.testing.fuzzInput`, harness setup) against your project's declared Zig version — this is an actively evolving area of the toolchain.

## See Also

- [test-error-union-expect](test-error-union-expect.md) - asserting specific, expected failure modes deliberately
- [interop-null-terminated-strings](interop-null-terminated-strings.md) - another boundary where malformed input is common
- [proj-version-pin](proj-version-pin.md) - why fuzzing API details must be checked against your toolchain version
