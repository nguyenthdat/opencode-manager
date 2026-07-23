# conc-no-async-await

> Zig removed language-level `async`/`suspend`/`resume` — use OS threads or an explicit event-loop library instead

## Why It Matters

Earlier Zig versions experimented with built-in stackful coroutines (`async fn`, `suspend`, `resume`) as a concurrency primitive; this was removed from the language in later releases pending a redesign, and current Zig has no language-level async/await. Code (or tutorials) referencing `async fn` reflects an old version of the language — current concurrency is expressed with `std.Thread` for OS threads, or an explicit, library-provided event loop for single-threaded concurrent I/O, depending on your Zig version.

## Bad

```zig
// Outdated: this pattern is not valid in current Zig releases and any
// guide showing it is describing a pre-removal version of the language.
const std = @import("std");

async fn fetchData() !Data {
    // suspend/resume-based coroutines: not available in current Zig
    unreachable;
}
```

## Good

```zig
const std = @import("std");

// Real OS threads for parallel work.
fn fetchDataThreaded(allocator: std.mem.Allocator) !Data {
    const thread = try std.Thread.spawn(.{}, fetchDataBlocking, .{allocator});
    defer thread.join();
    return Data{};
}

fn fetchDataBlocking(allocator: std.mem.Allocator) Data {
    _ = allocator;
    return Data{};
}

const Data = struct {};
```

## Check Your Project's Declared Version Before Assuming Async Exists

If a codebase or tutorial you're referencing uses `async fn`/`suspend`/`resume`, verify against your actual toolchain's release notes whether that applies — this is exactly the kind of API churn `proj-version-pin` exists to make explicit and deliberate, rather than a source of confusing, version-mismatched code.

## See Also

- [conc-thread-spawn](conc-thread-spawn.md) - the current, stable primitive for concurrent work
- [proj-version-pin](proj-version-pin.md) - why checking the declared Zig version matters before relying on any specific concurrency API
- [conc-avoid-shared-mutable](conc-avoid-shared-mutable.md) - designing concurrent work to minimize synchronization regardless of the underlying primitive
