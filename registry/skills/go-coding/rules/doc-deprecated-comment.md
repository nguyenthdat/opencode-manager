# doc-deprecated-comment

> Mark deprecated identifiers with a `// Deprecated:` comment

## Why It Matters

`// Deprecated: ...` is a recognized convention (documented in the Go doc comment spec) that tooling actively surfaces - `go vet`'s `deprecated` analyzer flags call sites, IDEs strike through the identifier, and `pkg.go.dev` visually marks it. A plain comment saying "don't use this" without the exact `Deprecated:` marker gets none of that tooling support.

## Bad

```go
// Don't use this anymore, use FetchUserV2 instead. // no tooling recognizes this phrasing
func FetchUser(id string) (*User, error) { ... }

// old and should be replaced
type LegacyConfig struct{ ... }
```

## Good

```go
// FetchUser retrieves a user by ID.
//
// Deprecated: use FetchUserV2, which supports context cancellation and
// returns a wrapped error chain. FetchUser will be removed in v3.0.0.
func FetchUser(id string) (*User, error) { ... }

// LegacyConfig holds configuration for the pre-v2 client.
//
// Deprecated: use Config instead.
type LegacyConfig struct{ ... }
```

## What Editors and `go vet` Do With It

```go
user, err := FetchUser("1") // IDEs render FetchUser with a strikethrough;
                              // `go vet` (via staticcheck's SA1019) flags this call site
```

```sh
go vet ./...
# main.go:42:2: SA1019: FetchUser is deprecated: use FetchUserV2 ...
```

## Format Requirements

- The paragraph must start with the exact literal text `Deprecated:` (capital D, followed by a colon) on its own line, typically as the last paragraph of the doc comment.
- Explain what to use instead and, if relevant, when the deprecated item will be removed.
- Deprecate at the narrowest scope that applies - a single function, not the whole package, unless the entire package is being replaced.

## Deprecating a Whole Package

```go
// Package legacyapi provides the pre-v2 HTTP client.
//
// Deprecated: use package api instead, which supports context cancellation
// and structured errors. legacyapi will be removed in a future major version.
package legacyapi
```

## See Also

- [doc-comment-starts-with-name](doc-comment-starts-with-name.md) - The doc comment convention this marker is embedded within
- [lint-staticcheck-enabled](lint-staticcheck-enabled.md) - The `SA1019` check that flags deprecated call sites
- [proj-version-module-path](proj-version-module-path.md) - Coordinating deprecation with a major version bump
