# api-options-struct

> Use an `Options`/`Config` struct parameter (with field defaults) for functions with many optional parameters

## Why It Matters

Zig has no function overloading and no named/default arguments at the call site beyond what a struct literal already provides. An options struct with default field values (`.{}` for "all defaults") gives callers a self-documenting, keyword-argument-like call syntax, and adding a new optional setting later doesn't break any existing call site.

## Bad

```zig
const std = @import("std");

// Adding a new bool parameter to this in the future breaks every call site,
// and callers must remember positional order for values they rarely change.
fn createServer(port: u16, max_connections: u32, use_tls: bool, timeout_ms: u32) void {
    _ = port;
    _ = max_connections;
    _ = use_tls;
    _ = timeout_ms;
}
```

## Good

```zig
const std = @import("std");

const ServerOptions = struct {
    port: u16 = 8080,
    max_connections: u32 = 100,
    use_tls: bool = false,
    timeout_ms: u32 = 30_000,
};

fn createServer(options: ServerOptions) void {
    std.debug.print("listening on {d}\n", .{options.port});
    _ = options.max_connections;
    _ = options.use_tls;
    _ = options.timeout_ms;
}

test "options struct with defaults" {
    createServer(.{}); // all defaults
    createServer(.{ .port = 9090, .use_tls = true }); // override just what matters
}
```

## This Is Also the Standard Library's Own Convention

`std.heap.GeneralPurposeAllocator(.{ .safety = true })`, `std.fs.File.OpenFlags`, and many other std APIs follow exactly this pattern — matching it keeps your API's calling convention familiar to anyone who has used the standard library.

## See Also

- [api-init-deinit-convention](api-init-deinit-convention.md) - `init` is a common place to accept an options struct
- [comptime-config-validate](comptime-config-validate.md) - validating comptime-known options fields
- [api-default-impl](../rust-coding/rules/api-default-impl.md) - the analogous Rust `Default` idiom, for comparison
