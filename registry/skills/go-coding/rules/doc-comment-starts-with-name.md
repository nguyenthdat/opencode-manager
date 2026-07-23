# doc-comment-starts-with-name

> Doc comments start with the name of the thing they document

## Why It Matters

`go doc` and godoc.org/pkg.go.dev extract doc comments verbatim and rely on the convention that a comment begins with the identifier's own name, so tools and readers alike can tell at a glance which comment documents which declaration - and so the comment reads as a grammatically complete sentence when displayed on its own.

## Bad

```go
// This function fetches a user by their ID from the database.
func FetchUser(ctx context.Context, id string) (*User, error) { ... }

// Represents a validated email address.
type Email string

// Returns true if the cache has expired.
func (c *Cache) Expired() bool { ... }
```

## Good

```go
// FetchUser retrieves a user by their ID from the database.
func FetchUser(ctx context.Context, id string) (*User, error) { ... }

// Email represents a validated email address.
type Email string

// Expired reports whether the cache has expired.
func (c *Cache) Expired() bool { ... }
```

## The `go vet` Check

`go vet`'s `comment` check (and `golangci-lint`'s `revive`/`staticcheck` rules) flags exported declarations whose doc comment doesn't start with the declared name:

```
main.go:12:1: comment on exported function FetchUser should be of the form "FetchUser ..."
```

## Boolean-Returning Methods: "Reports Whether"

```go
// IsValid reports whether the input satisfies all required constraints.
func (v *Validator) IsValid(input string) bool { ... }
```

"Reports whether X" is the idiomatic phrasing the standard library uses for boolean-returning functions, instead of "Returns true if X."

## Package-Level Doc Comments Are the One Exception

```go
// Package cache provides an in-memory, TTL-based key/value cache.
package cache
```

A package doc comment starts with `Package <name>`, not just the bare package name - this is the one place the "starts with the identifier" rule takes a slightly different, but still name-first, form.

## See Also

- [doc-package-doc-file](doc-package-doc-file.md) - Where the package-level doc comment usually lives
- [doc-avoid-redundant-comments](doc-avoid-redundant-comments.md) - Not restating what the signature already says
- [lint-missing-docs](lint-missing-docs.md) - Enforcing that every exported identifier has a doc comment at all
