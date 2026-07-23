# test-refAllDecls

> Use `std.testing.refAllDecls` (or explicit imports) to ensure tests in imported files are actually discovered

## Why It Matters

`zig test`/`zig build test` only runs tests reachable from the given root file's dependency graph — a `test` block in a file that's never `@import`ed (directly or transitively) from the test root simply never runs, silently. `std.testing.refAllDecls(@This())` (or a comparable explicit reference) forces the compiler to notice every declaration in a module, pulling its `test` blocks into the discovered set.

## Bad

```zig
// main_test.zig — the root test file only imports the two modules it
// happens to remember; a third module's tests never run, and nothing
// warns that they're being skipped.
const std = @import("std");
test {
    _ = @import("parser.zig");
    _ = @import("lexer.zig");
    // formatter.zig has its own `test` blocks but is never referenced here.
}
```

## Good

```zig
// main_test.zig
const std = @import("std");

test {
    std.testing.refAllDecls(@This());
}

const parser = @import("parser.zig");
const lexer = @import("lexer.zig");
const formatter = @import("formatter.zig"); // now guaranteed to be referenced
```

## Per-Module Alternative

Some projects instead put a `test { std.testing.refAllDecls(@This()); }` directly inside each module file, guaranteeing that module's own nested declarations get pulled in regardless of the root test file's import list.

## See Also

- [test-builtin-test-block](test-builtin-test-block.md) - the test blocks this mechanism ensures are discovered
- [test-zig-test-command](test-zig-test-command.md) - running the discovered test set in CI
- [proj-src-root-module](proj-src-root-module.md) - the root module structure this discovery depends on
