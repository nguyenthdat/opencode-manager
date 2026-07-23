# test-zig-test-command

> Run `zig build test` (or `zig test`) in CI on every change

## Why It Matters

Zig's test runner is built into the toolchain — there's no separate framework to install, configure, or keep in sync with the compiler version. Wiring `zig build test` into CI (and requiring it to pass before merge) costs almost nothing to set up and catches regressions, leaked allocations (via `std.testing.allocator`), and failing doc examples automatically on every push.

## Bad

```yaml
# .github/workflows/ci.yml — build-only CI never actually runs the test suite.
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mlugg/setup-zig@v1
      - run: zig build
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
          version: "0.13.0" # match the project's declared Zig version exactly
      - run: zig build test --summary all
      - run: zig fmt --check .
```

## A `test` Build Step in `build.zig`

```zig
// build.zig (excerpt)
const test_step = b.step("test", "Run unit tests");
const tests = b.addTest(.{
    .root_source_file = b.path("src/root.zig"),
    .target = target,
    .optimize = optimize,
});
const run_tests = b.addRunArtifact(tests);
test_step.dependOn(&run_tests.step);
```

## See Also

- [proj-build-steps-custom](proj-build-steps-custom.md) - defining the `test` step this command runs
- [lint-zig-fmt-ci](lint-zig-fmt-ci.md) - pairing the test run with a formatting check in the same CI job
- [proj-version-pin](proj-version-pin.md) - pinning the exact Zig version CI uses
