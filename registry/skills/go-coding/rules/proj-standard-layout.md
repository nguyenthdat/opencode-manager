# proj-standard-layout

> Follow the community-standard layout: `cmd/`, `internal/`, root package

## Why It Matters

While Go doesn't enforce a project layout, the community has converged on a small set of conventions (documented informally as `golang-standards/project-layout`) that most Go developers recognize instantly: `cmd/` for binaries, `internal/` for code that shouldn't be imported externally, and the module root or a small number of top-level packages for the primary library API. Following it means new contributors and tools (like `go install ./cmd/...`) know where to look without guessing.

## Bad

```
myproject/
  main.go            # which binary is this, if there could be several?
  src/                # "src/" is not a Go convention - Go doesn't need this indirection
    server.go
    client.go
  helpers/            # unclear whether this is public API or an internal detail
    utils.go
```

## Good

```
myproject/
  go.mod
  cmd/
    server/
      main.go         # entry point for the "server" binary
    cli/
      main.go         # entry point for the "cli" binary
  internal/
    store/            # implementation details, not importable outside this module
      store.go
    httpapi/
      handler.go
  client.go            # the module's public API, at the root import path
  README.md
```

## When a Simpler Layout Is More Appropriate

```
smalltool/
  go.mod
  main.go   # a single small binary doesn't need cmd/<name>/main.go - see proj-flat-small-packages
```

For a project that's just one binary with no separate library API, a flat layout with `main.go` at the root is simpler and equally idiomatic - `cmd/` earns its complexity once there's more than one entry point or a library to keep separate from the binaries that use it.

## See Also

- [proj-cmd-per-binary](proj-cmd-per-binary.md) - The `cmd/<name>/main.go` convention in more depth
- [proj-internal-packages](proj-internal-packages.md) - How `internal/` enforces this layout at the compiler level
- [proj-flat-small-packages](proj-flat-small-packages.md) - When to skip this layout for a small project
