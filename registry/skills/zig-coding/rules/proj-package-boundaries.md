# proj-package-boundaries

> Define package/module boundaries around cohesive functionality, not around implementation mechanics

## Why It Matters

A good module boundary groups things that change together and hides details that don't need to leak out — a `networking` module, a `config` module, a `storage` module, each with a small, deliberate public surface. Boundaries drawn around implementation mechanics instead (a `structs` module, a `helpers` module) tend to have no real cohesion: everything in them changes for unrelated reasons, and nothing about the grouping helps a reader predict what's inside.

## Bad

```
src/
  structs.zig     # every struct in the project, regardless of purpose
  helpers.zig     # every free function that didn't obviously belong elsewhere
  constants.zig   # every constant, unrelated to each other
```
Adding a networking feature touches `structs.zig`, `helpers.zig`, and `constants.zig` all at once — the "module" boundaries don't correspond to any real seam in the system.

## Good

```
src/
  root.zig
  networking.zig   # HTTP client, connection pooling — cohesive, changes together
  config.zig       # loading, validation, defaults — cohesive, changes together
  storage.zig       # on-disk persistence — cohesive, changes together
```
Adding a networking feature touches only `networking.zig`; the module boundary tracks a real domain concept.

## See Also

- [api-avoid-god-struct](api-avoid-god-struct.md) - the type-level version of the same cohesion principle
- [proj-flat-small](proj-flat-small.md) - not drawing these boundaries prematurely, before they're earned
- [api-namespace-file](api-namespace-file.md) - the file-as-namespace mechanism these boundaries are built from
