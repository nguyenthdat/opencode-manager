# proj-version-module-path

> Include a `/vN` suffix in the module path for major version 2 and above

## Why It Matters

Go's module system uses semantic import versioning: major versions 2 and above must be reflected in the module path itself (`/v2`, `/v3`, ...). This lets two different major versions of the same module coexist in a single build's dependency graph (a common situation when different dependencies require different majors), which would otherwise be impossible since Go resolves one version per unversioned import path.

## Bad

```
// go.mod for a v2.0.0 release, path unchanged from v1:
module example.com/myproject

// This works for `go get example.com/myproject@v2.0.0` in isolation, but any
// dependency graph that also needs myproject v1.x alongside this v2.x cannot
// resolve both - Go has no way to distinguish which "example.com/myproject"
// import in the source refers to which major version.
```

## Good

```
// go.mod for the v2 release:
module example.com/myproject/v2

go 1.24
```

```go
// consumers import the versioned path explicitly:
import "example.com/myproject/v2"
```

```sh
go get example.com/myproject/v2@v2.0.0
```

## Tagging Releases to Match

```sh
git tag v2.0.0    # the git tag's major version must match the /v2 in go.mod
git push --tags
```

If the module path says `/v2` but the tag is `v1.x`, or vice versa, `go get` reports a version mismatch error - the module path suffix and the git tag's major version must agree.

## v0/v1 Need No Suffix

```
module example.com/myproject   // v0.x.y and v1.x.y both use this unversioned path
```

Only v2 and beyond require the path suffix - this is specifically how Go supports multiple incompatible major versions of the same module coexisting in one build.

## See Also

- [doc-deprecated-comment](doc-deprecated-comment.md) - Deprecating old APIs ahead of a major version bump
- [doc-changelog-readme](doc-changelog-readme.md) - Documenting breaking changes alongside the version bump
- [proj-module-hygiene](proj-module-hygiene.md) - General `go.mod` hygiene this versioning discipline is part of
