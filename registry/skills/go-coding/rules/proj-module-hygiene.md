# proj-module-hygiene

> Keep `go.mod`/`go.sum` clean, minimal, and current

## Why It Matters

`go.mod` declares your module's dependency graph and minimum Go version; `go.sum` pins the exact, verified checksums of every dependency (direct and transitive). Letting these drift - stale `go` directives, unused requirements never pruned, a `go.sum` that's manually hand-edited - produces confusing build behavior and undermines the supply-chain integrity `go.sum` exists to provide.

## Bad

```
// go.mod
module example.com/myproject

go 1.18                       // far behind the toolchain actually used to build/test

require (
	github.com/old/unused v1.0.0   // no longer imported anywhere, never removed
	github.com/pkg/errors v0.9.1
)
```

```sh
# go.sum manually edited or left stale after dependency changes -
# `go build` may still work by re-resolving, but verification integrity is weakened
```

## Good

```sh
go mod tidy      # removes unused requirements, adds missing ones, updates go.sum
go mod verify    # confirms go.sum matches the actual downloaded module content
go list -m -u all  # shows which dependencies have newer versions available
```

```
// go.mod, after `go mod tidy`
module example.com/myproject

go 1.24

require (
	github.com/google/uuid v1.6.0
)
```

## Run `go mod tidy` as Part of CI

```yaml
# .github/workflows/ci.yml
- run: go mod tidy
- run: git diff --exit-code go.mod go.sum # fail CI if tidy would have changed anything
```

This catches the common mistake of adding an import, forgetting to run `go mod tidy`, and committing a `go.mod` that doesn't match the actual import graph.

## Vendoring: When and Why

```sh
go mod vendor    # copies all dependencies into a committed vendor/ directory
```

Vendoring is worth it for environments with restricted network access during builds, or organizations wanting every dependency's source committed and auditable alongside the code - `go build`/`go test` automatically use `vendor/` when it's present and consistent with `go.mod`.

## See Also

- [proj-go-work-multi-module](proj-go-work-multi-module.md) - Multi-module local development, kept separate from committed `go.mod` state
- [lint-ci-gating](lint-ci-gating.md) - Wiring `go mod tidy` verification into the same CI gate as linting
- [proj-version-module-path](proj-version-module-path.md) - The `go.mod` module path itself, for major version bumps
