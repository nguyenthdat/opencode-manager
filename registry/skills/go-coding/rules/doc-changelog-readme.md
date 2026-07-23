# doc-changelog-readme

> Maintain a README and CHANGELOG at the project root

## Why It Matters

`go doc`/pkg.go.dev cover API-level documentation, but they don't tell a new user how to install the module, what problem it solves, or what changed between versions. A `README.md` (rendered automatically by pkg.go.dev, GitHub, and GitLab) and a `CHANGELOG.md` are the first things a prospective user or upgrading consumer looks for, and their absence is a real adoption and maintenance cost.

## Bad

```
myproject/
  go.mod
  main.go
  internal/
  # no README, no CHANGELOG - a new user has to read source to understand
  # what this does, how to install it, or what changed in the latest tag
```

## Good

```
myproject/
  go.mod
  main.go
  internal/
  README.md
  CHANGELOG.md
  LICENSE
```

## A Minimal, Useful README

```markdown
# myproject

Short description of what this does and why it exists.

## Install

    go get example.com/myproject

## Usage

```go
client := myproject.New()
result, err := client.Do(ctx, req)
```

## Documentation

See https://pkg.go.dev/example.com/myproject for full API docs.
```

## A CHANGELOG Following Keep a Changelog Conventions

```markdown
# Changelog

## [1.2.0] - 2026-06-01

### Added
- `WithTimeout` option for `Client`.

### Fixed
- Race condition in `Cache.Set` under concurrent writes (#42).

### Changed
- `FetchUser` is now deprecated in favor of `FetchUserV2`.
```

## Automating Changelog Generation

Tools like `git-chglog` or conventional-commit-based generators can produce a changelog automatically from commit history, provided commit messages follow a consistent format (`feat:`, `fix:`, `BREAKING CHANGE:`) - useful once a project's release cadence makes hand-maintaining one tedious.

## See Also

- [doc-package-doc-file](doc-package-doc-file.md) - API-level documentation that the README should link to, not duplicate
- [proj-version-module-path](proj-version-module-path.md) - Coordinating changelog entries with major version bumps
- [doc-deprecated-comment](doc-deprecated-comment.md) - Deprecations noted in code should also surface in the changelog
