# name-consts-screaming-or-camel

> Use `SCREAMING_SNAKE_CASE` sparingly for true global constants; prefer `camelCase` for ordinary `const` bindings

## Why It Matters

Unlike some C-influenced languages, Zig's own style does not universally scream-case every `const` — most `const` bindings are simply immutable local or file-scoped values and follow ordinary `camelCase`, matching variables. `SCREAMING_SNAKE_CASE` is reserved, by convention, for a small set of truly global, build-wide constants (rare in idiomatic Zig code, more common when mirroring a C header's macro constants).

## Bad

```zig
const std = @import("std");

// Screaming-case for an ordinary local constant adds visual shouting with
// no extra meaning — this is not how idiomatic Zig reads.
fn compute() u32 {
    const MAX_RETRIES = 3;
    return MAX_RETRIES * 2;
}
```

## Good

```zig
const std = @import("std");

fn compute() u32 {
    const maxRetries = 3; // ordinary immutable local: camelCase
    return maxRetries * 2;
}

// Reserved for genuinely global, build-wide, or C-header-mirroring constants.
pub const MAX_PATH_LEN: usize = 4096; // mirrors a platform-wide OS constant

test "naming for constants" {
    try std.testing.expectEqual(@as(u32, 6), compute());
}
```

## See Also

- [name-funcs-camelcase](name-funcs-camelcase.md) - the default casing most `const` bindings should follow
- [interop-c-abi-types](interop-c-abi-types.md) - mirroring C header constants, where screaming-case sometimes carries over
- [name-types-titlecase](name-types-titlecase.md) - the type-naming convention this rule is distinct from
