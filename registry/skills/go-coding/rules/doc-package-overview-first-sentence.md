# doc-package-overview-first-sentence

> Make the first sentence of a doc comment a complete, standalone summary

## Why It Matters

Tools that generate package indexes, search results, and hover tooltips (pkg.go.dev's package list, `go doc` summaries, IDE autocomplete) extract only the *first sentence* of a doc comment to use as a one-line summary. If that first sentence depends on later context or trails off, the generated summary is incomplete or confusing wherever it's shown in isolation.

## Bad

```go
// This package has some helpers.
//
// Specifically, it provides retry logic with exponential backoff, jitter,
// and configurable maximum attempts, which is useful when calling flaky
// upstream services.
package retry
// The extracted first-sentence summary ("This package has some helpers.")
// tells a reader browsing a package index almost nothing.
```

## Good

```go
// Package retry provides retry logic with exponential backoff, jitter, and
// configurable maximum attempts, for calling flaky upstream services.
package retry
// First sentence alone: "Package retry provides retry logic with exponential
// backoff, jitter, and configurable maximum attempts, for calling flaky
// upstream services." - a complete, useful summary on its own.
```

## The Same Rule Applies to Function/Type Doc Comments

```go
// Bad: first sentence is incomplete without the rest of the paragraph
// FetchUser gets the user. It queries the database using the provided ID and
// returns an error wrapping sql.ErrNoRows if not found.
func FetchUser(ctx context.Context, id string) (*User, error) { ... }

// Good: first sentence stands alone as a useful summary
// FetchUser retrieves a user by ID, returning an error wrapping
// sql.ErrNoRows if the user does not exist.
func FetchUser(ctx context.Context, id string) (*User, error) { ... }
```

## Keep the First Sentence Reasonably Short

A first sentence that runs to several lines defeats the purpose of being a scannable summary - if there's a lot to say, put the essential one-line summary first and elaborate in subsequent sentences/paragraphs.

## See Also

- [doc-comment-starts-with-name](doc-comment-starts-with-name.md) - The "starts with the identifier's name" convention this sentence follows
- [doc-package-doc-file](doc-package-doc-file.md) - Where this package-level summary typically lives
- [doc-avoid-redundant-comments](doc-avoid-redundant-comments.md) - Keeping the summary informative rather than just restating the name
