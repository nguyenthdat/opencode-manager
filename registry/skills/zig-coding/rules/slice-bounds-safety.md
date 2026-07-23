# slice-bounds-safety

> Rely on slice bounds checking in Debug/ReleaseSafe instead of hand-rolled manual checks

## Why It Matters

Indexing a slice out of range panics with a clear "index out of bounds" message in `Debug` and `ReleaseSafe` builds — this is a real safety net, not just a debugging convenience, and it exists precisely so you don't need to duplicate the same length check the compiler already inserts. Manually re-checking bounds before every index adds code and a second place for the check to drift from the actual access.

## Bad

```zig
const std = @import("std");

fn get(items: []const i32, index: usize) ?i32 {
    // Redundant: the slice access below is already bounds-checked by the
    // compiler in Debug/ReleaseSafe; this duplicates that logic by hand
    // and can drift out of sync (e.g. an off-by-one in the manual check).
    if (index < 0 or index >= items.len) return null; // `index < 0` is even
    return items[index];                               // dead code for usize
}
```

## Good

```zig
const std = @import("std");

fn get(items: []const i32, index: usize) ?i32 {
    if (index >= items.len) return null; // one clear check, matches intent
    return items[index];
}

// Or delegate entirely to a standard helper where one exists.
fn safeSlice(items: []const i32, start: usize, end: usize) ?[]const i32 {
    if (start > end or end > items.len) return null;
    return items[start..end];
}
```

## Understand What Each Build Mode Actually Guarantees

`Debug` and `ReleaseSafe` insert real bounds checks that panic on violation. `ReleaseFast` and `ReleaseSmall` remove them for speed/size — out-of-bounds access there is undefined behavior. Ship `ReleaseFast` only for code paths that have been thoroughly tested under `Debug`/`ReleaseSafe` first. See `lint-releasesafe-prod`.

## See Also

- [lint-releasesafe-prod](lint-releasesafe-prod.md) - choosing a build mode that keeps this safety net in production
- [lint-debug-default](lint-debug-default.md) - defaulting to the safest mode during development
- [err-no-unreachable-recoverable](err-no-unreachable-recoverable.md) - not papering over real bounds violations with `unreachable`
