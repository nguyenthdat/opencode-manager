# name-files-as-namespace

> Name a file to match the primary type or namespace it exposes

## Why It Matters

Because every Zig file is itself a namespace (`api-namespace-file`), the file's name becomes the first thing a reader sees when they `@import` it — `@import("parser.zig")` should contain parsing-related declarations, ideally centered on one clear concept (often a single primary type named to match, like a `Parser` struct inside `parser.zig`). A mismatched file name forces readers to open the file to discover what it actually contains.

## Bad

```zig
// utils.zig — a vague, catch-all name gives no signal about contents.
const std = @import("std");

pub const HttpClient = struct {
    // ...
};
```

## Good

```zig
// http_client.zig — the file name matches its primary exported type.
const std = @import("std");

pub const HttpClient = struct {
    base_url: []const u8,

    pub fn get(self: HttpClient, path: []const u8) !void {
        _ = self;
        _ = path;
    }
};
```

```zig
// usage elsewhere
const HttpClient = @import("http_client.zig").HttpClient;
```

## Snake_case File Names, TitleCase Type Names

File names themselves follow `snake_case` (matching typical filesystem conventions across platforms), even though the primary type they export is `TitleCase` — `http_client.zig` exporting `HttpClient` is the expected pairing, not `HttpClient.zig`.

## See Also

- [api-namespace-file](api-namespace-file.md) - the mechanism (files as namespaces) this naming convention supports
- [name-types-titlecase](name-types-titlecase.md) - the casing convention for the type the file is named after
- [proj-src-root-module](proj-src-root-module.md) - naming the root module specifically
