# err-switch-exhaustive-err

> Exhaustively `switch` on an error set when different errors call for genuinely different recovery

## Why It Matters

A named error set is a closed, enumerable list — `switch` over it can be exhaustive, and the compiler will flag a new variant added later as a compile error at every call site that switches on it (unless an `else` prong absorbs it). That's a feature: it forces you to consciously decide how new failure modes should be handled instead of letting them fall through a catch-all silently.

## Bad

```zig
const std = @import("std");

const FetchError = error{ Timeout, NotFound, ServerError, RateLimited };

fn handle(err: FetchError) void {
    // A single catch-all treats a rate limit exactly like a 404 — likely wrong,
    // and it hides the fact that four distinct failure modes exist.
    std.log.err("fetch failed: {s}", .{@errorName(err)});
}
```

## Good

```zig
const std = @import("std");

const FetchError = error{ Timeout, NotFound, ServerError, RateLimited };

fn handle(err: FetchError) void {
    switch (err) {
        error.Timeout => retryWithBackoff(),
        error.NotFound => logAndSkip(),
        error.ServerError => alertOncall(),
        error.RateLimited => retryAfterDelay(),
    }
}

fn retryWithBackoff() void {}
fn logAndSkip() void {}
fn alertOncall() void {}
fn retryAfterDelay() void {}
```

## Adding `else` Deliberately

Once an error set is merged from several sources (`err-merge-error-sets`) and grows large, an explicit `else` prong is reasonable — just make sure it's a conscious choice, not a way to avoid thinking about the set at all:

```zig
fn handleAny(err: anyerror) void {
    switch (err) {
        error.OutOfMemory => @panic("OOM"),
        else => std.log.err("unhandled error: {s}", .{@errorName(err)}), // deliberate catch-all
    }
}
```

## See Also

- [err-error-set-explicit](err-error-set-explicit.md) - the named sets this rule switches over
- [opt-switch-exhaustive](opt-switch-exhaustive.md) - the same exhaustiveness guarantee applied to enums
- [opt-switch-else-explicit](opt-switch-else-explicit.md) - being deliberate about `else` prongs in general
