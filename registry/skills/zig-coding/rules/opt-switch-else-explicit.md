# opt-switch-else-explicit

> Use an `else` prong deliberately — not as a reflex that silently swallows future variants

## Why It Matters

An `else` prong on a `switch` gives up the compiler's exhaustiveness guarantee (see `opt-switch-exhaustive`): any variant added later falls into `else` silently, with no build failure to flag that it needs attention. Sometimes that's genuinely correct (many variants truly do share one fallback behavior) — but it should be a conscious trade-off, ideally with a comment explaining why the fallback is safe for variants that don't exist yet.

## Bad

```zig
const std = @import("std");

const LogLevel = enum { debug, info, warn, err, fatal };

// `else` here isn't a real design choice — it's covering for not wanting
// to list `.fatal`, and a future `.trace` level silently gets the wrong color.
fn colorFor(level: LogLevel) []const u8 {
    return switch (level) {
        .debug => "gray",
        .info => "blue",
        else => "red",
    };
}
```

## Good

```zig
const std = @import("std");

const LogLevel = enum { debug, info, warn, err, fatal };

fn colorFor(level: LogLevel) []const u8 {
    return switch (level) {
        .debug => "gray",
        .info => "blue",
        .warn => "yellow",
        .err, .fatal => "red", // deliberate grouping, not a catch-all
    };
}

// A genuinely deliberate `else`: dozens of HTTP status codes share one bucket.
fn statusCategory(code: u16) []const u8 {
    return switch (code) {
        200...299 => "success",
        300...399 => "redirect",
        400...499 => "client_error",
        else => "server_error", // explicitly: "everything else is 5xx or unknown"
    };
}
```

## See Also

- [opt-switch-exhaustive](opt-switch-exhaustive.md) - the exhaustiveness guarantee this rule chooses to trade away
- [err-switch-exhaustive-err](err-switch-exhaustive-err.md) - the same trade-off applied to error sets
- [api-tagged-union-variants](api-tagged-union-variants.md) - designing variant sets with this trade-off in mind
