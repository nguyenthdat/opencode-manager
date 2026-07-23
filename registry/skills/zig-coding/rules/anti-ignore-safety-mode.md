# anti-ignore-safety-mode

> Don't ship `ReleaseFast` without ever having tested the same code under `Debug`/`ReleaseSafe`

## Why It Matters

`ReleaseFast` removes exactly the checks (bounds, overflow, `unreachable` verification) that would have caught a bug during testing — shipping code that has only ever been exercised under `ReleaseFast` means any bug those checks would have caught is now silently undefined behavior in production instead of a clear, loud test failure during development.

## Bad

```yaml
# .github/workflows/ci.yml — the only build/test ever run is under
# ReleaseFast; if there's a hidden overflow or out-of-bounds access, the
# safety checks that would catch it are never active during CI at all.
- run: zig build -Doptimize=ReleaseFast
- run: zig build test -Doptimize=ReleaseFast
```

## Good

```yaml
# .github/workflows/ci.yml — the full test suite runs under a
# safety-checked mode first; ReleaseFast is only used for the final,
# already-verified shipped artifact.
- name: Test under Debug (full safety checks)
  run: zig build test -Doptimize=Debug
- name: Test under ReleaseSafe (checks + optimizations)
  run: zig build test -Doptimize=ReleaseSafe
- name: Build shipped artifact
  run: zig build -Doptimize=ReleaseFast
```

## See Also

- [lint-releasefast-hotpath](lint-releasefast-hotpath.md) - the full rule this anti-pattern violates
- [lint-debug-default](lint-debug-default.md) - the safety-checked mode tests should run under first
- [perf-benchmark-before](perf-benchmark-before.md) - confirming ReleaseFast is even needed before reaching for it
