# doc-package-doc-file

> Put package-level documentation in a dedicated `doc.go` file for larger packages

## Why It Matters

Package documentation - an overview of what the package does, how its pieces fit together, and usage guidance too long for a single-line comment - needs a home. For anything beyond a one-line summary, a dedicated `doc.go` file containing only the package clause and its doc comment keeps that documentation easy to find and separate from any particular implementation file, which may come and go as the package evolves.

## Bad

```go
// client.go

// Package api provides a client for the Widget service. It handles
// authentication, retries, and request/response marshaling. See the
// Client type for the main entry point. Configuration is done via
// functional options passed to New. Errors are wrapped with context
// using fmt.Errorf and %w, so use errors.Is/errors.As to inspect them.
// Timeouts are enforced via context.Context passed to every method.
package api

type Client struct{ /* ... */ }
// The package doc is buried at the top of a file that's really about Client,
// and will be easy to lose track of as client.go grows.
```

## Good

```go
// doc.go

// Package api provides a client for the Widget service. It handles
// authentication, retries, and request/response marshaling. See the
// Client type for the main entry point. Configuration is done via
// functional options passed to New. Errors are wrapped with context
// using fmt.Errorf and %w, so use errors.Is/errors.As to inspect them.
// Timeouts are enforced via context.Context passed to every method.
package api
```

```go
// client.go
package api

type Client struct{ /* ... */ }

func New(baseURL string, opts ...Option) *Client { /* ... */ return nil }
```

## For Small Packages, a Short Comment Anywhere Is Fine

```go
// Package stringutil provides small string manipulation helpers not
// covered by the standard library's strings package.
package stringutil
```

A tiny, single-purpose package doesn't need a separate `doc.go` - the comment can live above the `package` clause in whichever file makes sense (often the first/primary file). Reach for `doc.go` once the package documentation grows substantial enough to want its own home, or the package has no single "main" file.

## See Also

- [doc-comment-starts-with-name](doc-comment-starts-with-name.md) - The "Package X ..." convention this doc comment follows
- [doc-package-overview-first-sentence](doc-package-overview-first-sentence.md) - Structuring the opening sentence for tooling that extracts summaries
- [proj-standard-layout](proj-standard-layout.md) - Where `doc.go` fits into overall project layout conventions
