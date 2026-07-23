# proj-version-pin

> Declare and pin the Zig compiler version a project targets, and preserve it deliberately

## Why It Matters

Because Zig is pre-1.0, both language features and standard library APIs can change between minor releases — code that compiles on 0.12 may not compile unmodified on 0.13. Declaring the exact expected version (via `build.zig.zon`'s `minimum_zig_version` field, a README note, and pinned CI toolchain setup) means contributors and CI use a known-good compiler, and any future migration to a newer version is a deliberate, tracked decision rather than something that happens by accident when someone's local `zig` updates.

## Bad

```zig
// build.zig.zon — no version declared at all; whether this project
// builds depends entirely on which Zig version happens to be installed
// on whichever machine runs it.
.{
    .name = "my_project",
    .version = "0.1.0",
}
```

## Good

```zig
// build.zig.zon
.{
    .name = "my_project",
    .version = "0.1.0",
    .minimum_zig_version = "0.13.0",
}
```

```yaml
# .github/workflows/ci.yml (excerpt) — CI pins the exact same version
- uses: mlugg/setup-zig@v1
  with:
    version: "0.13.0"
```

## When Migrating to a Newer Version

Treat a version bump as its own reviewed change: update `minimum_zig_version`, fix any resulting compile errors from std-lib API churn, update CI, and note the bump in the changelog (`doc-changelog-version`) — rather than letting the declared version drift silently out of sync with what actually builds.

## See Also

- [doc-changelog-version](doc-changelog-version.md) - recording version-bump decisions over time
- [proj-build-zig-zon-deps](proj-build-zig-zon-deps.md) - the manifest file this version declaration lives in
- [test-zig-test-command](test-zig-test-command.md) - CI pinning the same version used for testing
