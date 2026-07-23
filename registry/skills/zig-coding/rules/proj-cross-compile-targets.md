# proj-cross-compile-targets

> Declare supported cross-compilation targets explicitly in `build.zig`

## Why It Matters

Zig's bundled cross-compilation support (no separate sysroot or cross-toolchain needed for most targets) is one of its most distinctive practical features — but a project only actually gets reliable cross-builds if `build.zig` states which targets are supported and CI verifies them, rather than leaving it as an unverified, theoretical capability that quietly breaks the first time someone actually tries a target the maintainers never test.

## Bad

```zig
// build.zig — only ever exercises the host target; whether the project
// truly cross-compiles for anything else is unknown and unverified.
const target = b.standardTargetOptions(.{});
```

## Good

```zig
// build.zig (excerpt) — restrict (or default) to specific, tested targets
const target = b.standardTargetOptions(.{
    .default_target = .{ .cpu_arch = .x86_64, .os_tag = .linux },
});
```

```yaml
# .github/workflows/ci.yml (excerpt) — CI actually builds every supported target
strategy:
  matrix:
    target: [x86_64-linux-gnu, aarch64-linux-gnu, x86_64-macos, aarch64-macos, x86_64-windows-gnu]
steps:
  - run: zig build -Dtarget=${{ matrix.target }}
```

## Document the Supported Target List

State explicitly, in the README, which targets are tested in CI (and therefore actually supported) versus which "should probably work" but aren't verified — this sets accurate expectations for users on less common platforms.

## See Also

- [interop-zig-as-c-compiler](interop-zig-as-c-compiler.md) - `zig cc`'s cross-compilation support for mixed C/Zig builds
- [doc-readme-build](doc-readme-build.md) - documenting the supported target list for users
- [proj-build-zig-module](proj-build-zig-module.md) - the broader build graph these targets apply to
