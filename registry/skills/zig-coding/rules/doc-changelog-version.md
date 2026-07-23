# doc-changelog-version

> Document Zig-version compatibility and breaking changes as the project (and the language) evolves

## Why It Matters

Because Zig is pre-1.0, both your own project's API and the standard library APIs it depends on can change between compiler versions. A changelog entry noting "requires Zig 0.13+, updated for the `ArrayList` API change" saves every downstream consumer from having to bisect a confusing compile error back to a toolchain mismatch.

## Bad

```markdown
<!-- CHANGELOG.md -->
## 0.4.0
- Various fixes.
```

## Good

```markdown
<!-- CHANGELOG.md -->
## 0.4.0 (requires Zig 0.13.0+)
- **Breaking**: updated to Zig 0.13's `std.ArrayListUnmanaged` field-default
  syntax; projects on Zig 0.12 must stay on 0.3.x.
- Fixed a leak in `Registry.deinit` when entries contained duplicate keys.

## 0.3.0 (requires Zig 0.12.0+)
- **Breaking**: renamed `Config.parse` to `Config.load` for clarity.
```

## Pin the Compatible Version Range Explicitly

Alongside the changelog, `build.zig.zon`'s `minimum_zig_version` field (where supported by your toolchain) makes the requirement machine-checkable, not just documented prose — see `proj-version-pin`.

## See Also

- [proj-version-pin](proj-version-pin.md) - encoding the version requirement in `build.zig.zon` itself
- [doc-readme-build](doc-readme-build.md) - surfacing the current required version to new contributors
- [lint-warnings-as-errors](lint-warnings-as-errors.md) - catching deprecations early, before they become breaking changes
