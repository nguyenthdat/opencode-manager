# proj-flat-small

> Keep small projects flat; don't fragment into modules before there's a real reason to

## Why It Matters

A single-purpose CLI tool or small library rarely benefits from an elaborate module hierarchy planned in advance — premature fragmentation into many small files/modules adds indirection (more `@import`s to trace) without adding clarity, since there isn't yet enough distinct functionality to actually separate. Splitting up a file becomes worthwhile once it earns that complexity: a clear seam appears (a self-contained subsystem), or the file becomes genuinely hard to navigate.

## Bad

```
src/
  main.zig
  types/
    config_type.zig
    result_type.zig
  handlers/
    config_handler.zig
  utils/
    string_utils.zig
    misc_utils.zig
```
For a 300-line CLI tool, this hierarchy adds nine `@import` boundaries to trace through for what's fundamentally one small, cohesive task.

## Good

```
src/
  main.zig       # thin entry point
  root.zig       # config parsing, validation, and the tool's actual logic
```
Everything lives in two files until the project's actual complexity — not a guess about future complexity — justifies splitting further.

## When to Split

Split out a new file once one of these becomes true: a section grows large enough to be hard to scroll through and hold in your head, a piece of functionality is genuinely reusable from more than one entry point, or a natural, stable seam appears (parsing vs. execution, for instance) that isn't likely to be redrawn again soon.

## See Also

- [proj-src-root-module](proj-src-root-module.md) - the two-file starting point this rule describes
- [proj-package-boundaries](proj-package-boundaries.md) - the criteria for splitting once a project does grow
- [api-avoid-god-struct](api-avoid-god-struct.md) - avoiding the opposite failure mode within a single file
