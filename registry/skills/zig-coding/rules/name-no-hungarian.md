# name-no-hungarian

> Avoid Hungarian notation and redundant type-in-name prefixes; let the type system carry that information

## Why It Matters

Zig's type system already tells you a variable's type at its declaration (and your editor's tooling can show it inline) — prefixing names with `str`, `arr`, `p` for pointer, or similar type-encoding conventions just adds noise and, worse, can silently go stale if the variable's type changes but nobody updates the name.

## Bad

```zig
const std = @import("std");

fn greet(strName: []const u8, pConfig: *const Config) void {
    const arrScores: [3]u32 = .{ 1, 2, 3 };
    std.debug.print("{s} {any} {any}\n", .{ strName, pConfig, arrScores });
}

const Config = struct {};
```

## Good

```zig
const std = @import("std");

fn greet(name: []const u8, config: *const Config) void {
    const scores: [3]u32 = .{ 1, 2, 3 };
    std.debug.print("{s} {any} {any}\n", .{ name, config, scores });
}

const Config = struct {};
```

## Names Should Describe Meaning, Not Mechanism

Prefer a name that says what the value *represents* (`retry_count`, `active_connections`) over one that encodes *how* it's stored (`intRetryCount`, `arrActiveConns`) — the former stays accurate even if the underlying representation changes; the latter doesn't.

## See Also

- [name-fields-snake-or-camel](name-fields-snake-or-camel.md) - the casing convention names should still follow
- [type-newtype-ids](../rust-coding/rules/type-newtype-ids.md) - using the type system itself to carry meaning, for comparison
- [api-explicit-fallibility](api-explicit-fallibility.md) - letting signatures (not names) carry semantic information
