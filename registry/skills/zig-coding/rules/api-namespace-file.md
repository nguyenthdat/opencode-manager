# api-namespace-file

> Use a file as an implicit namespace/struct for a cohesive unit of related functionality

## Why It Matters

Every Zig file is itself an anonymous struct literal — `@import("foo.zig")` gives you a struct value whose fields are the file's top-level declarations. This means a file *is* a namespace without any extra ceremony: group related public functions, types, and constants in one file when they form one cohesive concept, and let the file boundary itself be the API surface, rather than wrapping everything in an explicit `pub const Namespace = struct { ... };` inside a larger file.

## Bad

```zig
const std = @import("std");

// Cramming unrelated concerns (string utilities and networking) into one
// file, then manually simulating namespaces with nested structs, when the
// file system itself already provides namespacing for free.
pub const string_utils = struct {
    pub fn trim(s: []const u8) []const u8 {
        return std.mem.trim(u8, s, " ");
    }
};
pub const net_utils = struct {
    pub fn parsePort(s: []const u8) !u16 {
        return std.fmt.parseInt(u16, s, 10);
    }
};
```

## Good

```zig
// string_utils.zig
const std = @import("std");

pub fn trim(s: []const u8) []const u8 {
    return std.mem.trim(u8, s, " ");
}

pub fn isBlank(s: []const u8) bool {
    return trim(s).len == 0;
}
```

```zig
// net_utils.zig
const std = @import("std");

pub fn parsePort(s: []const u8) !u16 {
    return std.fmt.parseInt(u16, s, 10);
}
```

```zig
// usage elsewhere
const string_utils = @import("string_utils.zig");
const net_utils = @import("net_utils.zig");

test "files as namespaces" {
    try @import("std").testing.expect(string_utils.isBlank("   "));
    _ = try net_utils.parsePort("8080");
}
```

## See Also

- [proj-src-root-module](proj-src-root-module.md) - the root-module convention this pattern builds toward
- [proj-package-boundaries](proj-package-boundaries.md) - grouping multiple such files into a coherent package
- [name-files-as-namespace](name-files-as-namespace.md) - naming a file to match the namespace it exposes
