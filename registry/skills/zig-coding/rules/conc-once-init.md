# conc-once-init

> Use `std.once` for one-time initialization guaranteed to run exactly once, even under concurrent callers

## Why It Matters

Lazily initializing shared global state (a compiled regex, a parsed config, a connection pool) from multiple threads without synchronization risks running the initialization twice, or having one thread observe a partially-initialized value. `std.once` (or the pattern it wraps) guarantees the initializer function runs exactly one time, with proper synchronization, regardless of how many threads call it concurrently.

## Bad

```zig
const std = @import("std");

var config: ?Config = null;

fn getConfig() Config {
    // Two threads calling this concurrently can both observe `config ==
    // null`, both compute and assign it, and one thread's data race is
    // undefined behavior — plus loadConfig() runs twice for no reason.
    if (config == null) {
        config = loadConfig();
    }
    return config.?;
}

const Config = struct {};
fn loadConfig() Config {
    return .{};
}
```

## Good

```zig
const std = @import("std");

var config: Config = undefined;
var config_once = std.once(initConfig);

fn initConfig() void {
    config = loadConfig();
}

fn getConfig() Config {
    config_once.call();
    return config;
}

const Config = struct {};
fn loadConfig() Config {
    return .{};
}

test "once-guarded initialization" {
    const c1 = getConfig();
    const c2 = getConfig();
    _ = c1;
    _ = c2; // initConfig() ran exactly once regardless of call count
}
```

## See Also

- [conc-atomic-ops](conc-atomic-ops.md) - the lower-level primitive `std.once` is typically built from
- [conc-mutex-guard](conc-mutex-guard.md) - a heavier-weight alternative for more complex one-time setup
- [alloc-arena-scoped](alloc-arena-scoped.md) - allocation concerns for the value being lazily initialized
