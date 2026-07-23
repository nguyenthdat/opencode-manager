# err-merge-error-sets

> Merge error sets deliberately with `||`; avoid reaching for `anyerror` out of convenience

## Why It Matters

Zig lets you combine error sets with `A || B`, producing the union of both sets' members. This composes cleanly as errors flow up through layers (I/O errors merged with parse errors merged with validation errors) while keeping the full set of possible failures visible and typed. Reaching for `anyerror` instead erases that information — callers can no longer `switch` exhaustively or know at a glance what a function might fail with.

## Bad

```zig
const std = @import("std");

// anyerror swallows all specificity: is this a file error? a parse error?
// a caller has to guess and can't switch exhaustively.
fn loadAndParse(allocator: std.mem.Allocator, path: []const u8) anyerror!Config {
    const data = try std.fs.cwd().readFileAlloc(allocator, path, 1 << 20);
    defer allocator.free(data);
    return parseConfig(data);
}
```

## Good

```zig
const std = @import("std");

const IoError = std.fs.File.OpenError || std.fs.File.ReadError;
const ParseError = error{ InvalidSyntax, MissingField };

pub const LoadError = IoError || ParseError || error{OutOfMemory};

fn loadAndParse(allocator: std.mem.Allocator, path: []const u8) LoadError!Config {
    const data = try std.fs.cwd().readFileAlloc(allocator, path, 1 << 20);
    defer allocator.free(data);
    return parseConfig(data);
}

// Callers can switch exhaustively on the merged set.
fn describe(err: LoadError) []const u8 {
    return switch (err) {
        error.FileNotFound => "config file missing",
        error.InvalidSyntax, error.MissingField => "config file malformed",
        error.OutOfMemory => "out of memory",
        else => "unexpected I/O error",
    };
}
```

## When `anyerror` Is Legitimate

At true top-level boundaries — a generic plugin dispatcher, `main`'s own return type, a callback signature that must accept arbitrary user error sets — `anyerror` is the honest choice because the set really is open-ended. See `err-anyerror-boundary`.

## See Also

- [err-error-set-explicit](err-error-set-explicit.md) - naming the sets being merged
- [err-anyerror-boundary](err-anyerror-boundary.md) - the narrow, legitimate use of `anyerror`
- [err-switch-exhaustive-err](err-switch-exhaustive-err.md) - what a well-typed merged set enables
