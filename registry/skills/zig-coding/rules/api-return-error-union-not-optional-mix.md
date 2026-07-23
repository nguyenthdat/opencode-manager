# api-return-error-union-not-optional-mix

> Don't conflate `?T` and `!T` for the same failure mode within one API — pick one and be consistent

## Why It Matters

A family of related functions that mixes `?T` for some "not found" cases and `!T` (with a `NotFound` error) for others forces every caller to remember, function by function, which unwrapping style applies where. Consistency within a related API surface (a single struct's methods, a single module's functions) matters as much as picking the theoretically "correct" one per `opt-null-vs-error` — inconsistency itself is the bug.

## Bad

```zig
const std = @import("std");

const Registry = struct {
    // Same conceptual operation ("look something up"), two different
    // failure representations depending on which method you call.
    fn findById(self: Registry, id: u64) ?User {
        _ = self;
        _ = id;
        return null;
    }
    fn findByName(self: Registry, name: []const u8) error{NotFound}!User {
        _ = self;
        _ = name;
        return error.NotFound;
    }
};

const User = struct { id: u64, name: []const u8 };
```

## Good

```zig
const std = @import("std");

const Registry = struct {
    // Both lookups use the same shape: absence is unremarkable, so both
    // return ?User consistently.
    fn findById(self: Registry, id: u64) ?User {
        _ = self;
        _ = id;
        return null;
    }
    fn findByName(self: Registry, name: []const u8) ?User {
        _ = self;
        _ = name;
        return null;
    }
};

const User = struct { id: u64, name: []const u8 };
```

## Document the Convention Once

For a larger API surface, state the convention up front (in a module-level `//!` doc comment) so every function's choice is predictable rather than needing to be checked case by case: "lookups return `?T`; parsing and I/O return `!T`."

## See Also

- [opt-null-vs-error](opt-null-vs-error.md) - the underlying decision this rule asks you to apply consistently
- [opt-nested-optional-avoid](opt-nested-optional-avoid.md) - avoiding confusion when the two shapes do need to combine
- [doc-module-doc-slash2](doc-module-doc-slash2.md) - documenting API-wide conventions at the module level
