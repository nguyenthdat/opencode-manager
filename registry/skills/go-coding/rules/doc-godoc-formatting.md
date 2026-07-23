# doc-godoc-formatting

> Use Go's doc comment formatting (headings, lists, links) instead of ad hoc text

## Why It Matters

Since Go 1.19, doc comments support a small, deliberately restrained formatting syntax - headings, bulleted/numbered lists, indented code blocks, and links - that `go doc` and pkg.go.dev render properly. Writing free-form text that ignores these conventions (manual ASCII art, unrecognized markup) either renders as a wall of text or displays literally instead of as intended.

## Bad

```go
// Package retry provides retry helpers.
//
// ============
// USAGE
// ============
// 1) Call retry.Do with a function
// 2) Configure options like WithMaxAttempts()
// See also: https://example.com/docs
//
// (none of this is recognized formatting - it just displays as plain text
// with the ASCII divider lines intact)
package retry
```

## Good

```go
// Package retry provides retry helpers with configurable backoff.
//
// # Usage
//
// Call [Do] with a function to retry:
//
//	err := retry.Do(ctx, func() error {
//		return callFlakyService()
//	})
//
// Configure behavior with options such as [WithMaxAttempts] and [WithBackoff].
//
// See the [package example] for a complete walkthrough.
//
// [package example]: https://pkg.go.dev/example.com/retry#example-package
package retry
```

## Formatting Elements

```go
// # Heading           -> rendered as a section heading
//
//	code block          -> a line indented with a tab is rendered as a code block
//
//   - bullet item       -> rendered as a bulleted list
//   - another item
//
// [Identifier]          -> an in-package doc link, e.g. [Client] or [Client.Do]
// [pkg.Identifier]       -> a cross-package doc link, e.g. [context.Context]
// [text]: url            -> a named link definition, referenced as [text] elsewhere
```

## Intra-Doc Links in Practice

```go
// Client sends requests using the configured [http.Client].
//
// Use [New] to construct a Client, or [NewWithTransport] to supply a
// custom [http.RoundTripper].
type Client struct{ ... }
```

## Rule of Thumb

Prefer the built-in heading/list/link/code-block syntax over manual formatting tricks - it's rendered consistently across `go doc`, IDE tooltips, and pkg.go.dev, which ad hoc formatting is not.

## See Also

- [doc-intra-links](doc-intra-links.md) - A closer look at the `[Identifier]` link syntax specifically
- [doc-comment-starts-with-name](doc-comment-starts-with-name.md) - The sentence structure surrounding this formatting
- [doc-example-tests](doc-example-tests.md) - Runnable examples that complement prose documentation
