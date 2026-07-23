# doc-public-api-only

> Reserve full doc comments for public (`pub`) declarations; keep private implementation comments terse

## Why It Matters

Every `pub` declaration is part of your project's contract with the outside world (or, at minimum, with other files in the same project) and deserves the full treatment: what it does, its error behavior, its ownership contract. A private helper used in exactly one place, by contrast, is implementation detail — a one-line `//` comment (or none, if the code is self-explanatory) keeps the file readable without padding it with ceremony nobody outside the file will ever read.

## Bad

```zig
const std = @import("std");

/// Adds two numbers together and returns their sum as an i32 value,
/// which represents the mathematical addition of parameter a and
/// parameter b in accordance with standard arithmetic rules.
fn addInternal(a: i32, b: i32) i32 { // private, over-documented
    return a + b;
}

// parses a config file — no real explanation of errors or ownership
pub fn parseConfig(allocator: std.mem.Allocator, path: []const u8) !Config {
    _ = allocator;
    _ = path;
    return Config{};
}

const Config = struct {};
```

## Good

```zig
const std = @import("std");

fn addInternal(a: i32, b: i32) i32 {
    return a + b;
}

/// Loads and parses the config file at `path`.
///
/// Returns `error.FileNotFound` if the file is missing, or
/// `error.InvalidSyntax` if it fails to parse. The caller owns the
/// returned `Config` and does not need to free anything, since it
/// contains no allocated fields.
pub fn parseConfig(allocator: std.mem.Allocator, path: []const u8) !Config {
    _ = allocator;
    _ = path;
    return Config{};
}

const Config = struct {};
```

## See Also

- [doc-doc-comment-slash3](doc-doc-comment-slash3.md) - the doc comment mechanism this rule allocates deliberately
- [proj-pub-visibility](proj-pub-visibility.md) - deciding what's `pub` in the first place
- [doc-params-return](doc-params-return.md) - calibrating documentation depth to what's actually non-obvious
