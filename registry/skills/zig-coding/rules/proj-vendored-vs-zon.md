# proj-vendored-vs-zon

> Prefer `build.zig.zon` dependencies over vendoring source, except where vendoring is a deliberate choice

## Why It Matters

Vendoring (copying a dependency's source directly into your repository) avoids network fetches and gives full control, but it also means manually tracking upstream updates, security fixes, and license terms with no tooling support. `build.zig.zon` dependencies (`proj-build-zig-zon-deps`) get hash-verified, reproducible fetches and a clear, single place recording exactly which version is in use — usually the better default unless there's a specific reason to vendor (no network access in the build environment, a heavily patched fork, an unmaintained dependency you now own).

## Bad

```
third_party/
  some_lib/          # copied in by hand, no record of which upstream
                       # version or commit this came from, no way to
                       # verify it hasn't been locally modified
    ...
```

## Good

```zig
// build.zig.zon — the dependency, its exact version, and its verified
// hash are all recorded in one place, refreshed with `zig fetch --save`.
.{
    .dependencies = .{
        .some_lib = .{
            .url = "https://github.com/example/some_lib/archive/refs/tags/v1.4.0.tar.gz",
            .hash = "1220...",
        },
    },
}
```

## When Vendoring Is the Right Call

- The build must work fully offline (air-gapped CI, restricted environments).
- The dependency has been forked and heavily patched — vendoring makes the divergence visible and reviewable in your own repo history.
- The upstream project is abandoned and you've effectively adopted it.

Even when vendoring, document *why* directly in the vendored directory (a short `NOTES.md` or top-of-file comment) so a future maintainer doesn't assume it was an oversight.

## See Also

- [proj-build-zig-zon-deps](proj-build-zig-zon-deps.md) - the preferred, hash-verified dependency mechanism
- [proj-version-pin](proj-version-pin.md) - pinning versions regardless of which mechanism is used
- [doc-changelog-version](doc-changelog-version.md) - documenting dependency/version decisions over time
