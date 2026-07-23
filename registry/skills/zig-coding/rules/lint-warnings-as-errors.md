# lint-warnings-as-errors

> Treat compiler warnings and deprecation notices as blocking in CI, not as ignorable noise

## Why It Matters

Zig's compiler emits warnings for a small but meaningful set of situations (deprecated standard library APIs slated for removal, for instance). Because Zig is pre-1.0 and std-lib APIs churn between versions, a deprecation warning today is very often a hard compile error on the next toolchain bump — treating warnings as blocking in CI catches this early, while there's still time to migrate calmly, instead of discovering it all at once during a forced version upgrade.

## Bad

```yaml
# .github/workflows/ci.yml — the build "passes" even though it's emitting
# deprecation warnings that will become compile errors on the next Zig
# version bump, and nobody is currently looking at them.
- run: zig build 2>&1 | tee build.log
- run: zig build test
```

## Good

```yaml
# .github/workflows/ci.yml
- name: Build (warnings are fatal)
  run: |
    zig build 2>&1 | tee build.log
    if grep -qi "deprecated\|warning" build.log; then
      echo "::error::Build produced warnings; treat as blocking."
      exit 1
    fi
- run: zig build test
```

## Fix Deprecations Promptly, Don't Accumulate Them

When a std-lib API you depend on is marked deprecated, migrate to its replacement in the same change cycle rather than deferring — accumulated deprecation debt is exactly what makes a future version bump painful instead of routine.

## See Also

- [proj-version-pin](proj-version-pin.md) - the pinned version whose upgrade this rule helps prepare for
- [doc-changelog-version](doc-changelog-version.md) - documenting version-related migrations as they happen
- [lint-zig-fmt-ci](lint-zig-fmt-ci.md) - another CI gate this check is naturally paired with
