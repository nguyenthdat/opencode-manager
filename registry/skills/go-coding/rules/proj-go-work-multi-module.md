# proj-go-work-multi-module

> Use `go.work` for local development across multiple modules

## Why It Matters

When developing two or more modules together (a library and a service that depends on it, both under active local changes), pointing `go.mod` at a local `replace` directive works but risks accidentally committing that replace and breaking the published module graph for everyone else. `go.work` (workspace mode, Go 1.18+) achieves the same local override without touching any `go.mod` file at all.

## Bad

```
// go.mod in service/, temporarily edited for local development:
module example.com/service

require example.com/lib v1.2.0

replace example.com/lib => ../lib // easy to forget to remove before committing/pushing
```

## Good

```
workspace-root/
  go.work
  lib/
    go.mod       // module example.com/lib
  service/
    go.mod       // module example.com/service, require example.com/lib v1.2.0 (unmodified)
```

```
// go.work
go 1.24

use (
	./lib
	./service
)
```

```sh
cd workspace-root
go build ./service/...   # uses the LOCAL ./lib, not the published v1.2.0, without editing any go.mod
```

`go.work` is typically added to `.gitignore` (or kept out of version control) since it's a local development convenience, not something every contributor or CI necessarily wants active - CI usually builds each module independently, exactly as external consumers would.

## Adding a Module to an Existing Workspace

```sh
go work use ./newmodule
go work sync # bring go.work's selected versions in line with each module's go.mod requirements
```

## When `go.work` Isn't Needed

For a single-module repository, or when you're not actively co-developing across module boundaries, `go.work` adds nothing - it exists specifically to solve the "multiple local modules that depend on each other, edited together" problem.

## See Also

- [proj-standard-layout](proj-standard-layout.md) - Where a multi-module repository's modules typically live
- [proj-module-hygiene](proj-module-hygiene.md) - Keeping `go.mod`/`go.sum` clean once workspace development is done
- [proj-version-module-path](proj-version-module-path.md) - Module versioning concerns that span the modules in a workspace
