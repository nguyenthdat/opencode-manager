# doc-module-doc-slash2

> Use `//!` at the top of a file for module-level documentation

## Why It Matters

`//!` comments attach to the *enclosing* item (typically the file/module itself, when placed at the top) rather than the following declaration — this is the right place to explain what a file is for as a whole, its overall conventions, and how its pieces fit together, before a reader dives into individual `///`-documented declarations.

## Bad

```zig
const std = @import("std");

// A plain `//` comment isn't recognized as module documentation by any
// tooling, and gives no structural signal that this is the file's overview.
// This module handles configuration loading and validation.

pub fn load(path: []const u8) !void {
    _ = path;
}
```

## Good

```zig
//! Configuration loading and validation.
//!
//! Functions in this module read configuration from disk, merge it with
//! environment overrides, and validate the result before returning it.
//! All fallible functions return a `ConfigError`; absence of an optional
//! setting is represented with `?T`, never a sentinel value.

const std = @import("std");

pub const ConfigError = error{ MissingFile, InvalidSyntax };

pub fn load(path: []const u8) ConfigError!void {
    _ = path;
}
```

## See Also

- [doc-doc-comment-slash3](doc-doc-comment-slash3.md) - the per-declaration counterpart to module docs
- [api-return-error-union-not-optional-mix](api-return-error-union-not-optional-mix.md) - the kind of module-wide convention worth stating here
- [proj-src-root-module](proj-src-root-module.md) - the root module, a natural place for top-level `//!` docs
