# lint-zig-fmt-ci

> Run `zig fmt --check` in CI to enforce consistent formatting

## Why It Matters

`zig fmt` is the toolchain's own canonical formatter — there's no configuration to argue about, no competing style guide, just one deterministic output every contributor's editor can produce. Enforcing `zig fmt --check` in CI (failing the build on unformatted code) keeps diffs focused on actual logic changes instead of incidental whitespace/style churn, and removes formatting from code review entirely.

## Bad

```yaml
# .github/workflows/ci.yml — no formatting check at all; style
# inconsistencies accumulate and get argued about in code review instead
# of being caught mechanically.
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mlugg/setup-zig@v1
      - run: zig build test
```

## Good

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mlugg/setup-zig@v1
        with:
          version: "0.13.0"
      - run: zig fmt --check .
      - run: zig build test --summary all
```

```sh
zig fmt .          # format everything locally before committing
zig fmt --check .  # exits non-zero if anything is unformatted (used above in CI)
```

## See Also

- [lint-zig-fmt-precommit](lint-zig-fmt-precommit.md) - catching formatting issues before they even reach CI
- [test-zig-test-command](test-zig-test-command.md) - the test run this formatting check is typically paired with
- [proj-version-pin](proj-version-pin.md) - pinning the exact `zig fmt` version CI uses, since formatting can change between releases
