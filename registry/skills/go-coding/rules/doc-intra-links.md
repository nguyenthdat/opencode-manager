# doc-intra-links

> Use `[Identifier]` doc links to cross-reference related types and functions

## Why It Matters

Since Go 1.19, wrapping an identifier in square brackets inside a doc comment (`[Client]`, `[context.Context]`) creates a real hyperlink when rendered by `go doc -all` or pkg.go.dev, connecting related documentation the way a reader would naturally want to navigate it - without that link, readers have to search for the referenced type manually.

## Bad

```go
// NewClient creates a Client. See Option for available configuration.
// Client wraps an http.Client and adds retry behavior.
func NewClient(opts ...Option) *Client { ... }
// "Client", "Option", and "http.Client" are just plain text here - no links rendered
```

## Good

```go
// NewClient creates a [Client]. See [Option] for available configuration.
// [Client] wraps an [http.Client] and adds retry behavior.
func NewClient(opts ...Option) *Client { ... }
```

## Linking Methods and Cross-Package Identifiers

```go
// Do sends the request, retrying according to the configured [Option] values.
// It returns an error wrapping [context.DeadlineExceeded] if every attempt
// times out. See [Client.SetTimeout] to adjust the per-attempt timeout.
func (c *Client) Do(ctx context.Context, req *Request) (*Response, error) { ... }
```

```
[Client]                  -> links to the Client type in this package
[Client.SetTimeout]        -> links to a specific method on Client
[context.DeadlineExceeded] -> links to an identifier in another package (must be imported)
[http.Client]              -> same: cross-package link, requires the package to be imported somewhere in this file
```

## Renaming the Link Text

```go
// See [the retry package] for automatic retry handling.
//
// [the retry package]: https://pkg.go.dev/example.com/retry
```

## A Common Mistake: Linking an Unimported Package

```go
// Returns a value compatible with [json.Marshaler]. // fails to link if this
// file never imports "encoding/json" - the identifier must be resolvable
// from an import already present somewhere in the package.
```

## See Also

- [doc-godoc-formatting](doc-godoc-formatting.md) - The broader doc comment formatting syntax this link style is part of
- [doc-comment-starts-with-name](doc-comment-starts-with-name.md) - Where these links typically appear, inside the opening doc comment
- [doc-example-tests](doc-example-tests.md) - Example functions that these links often point readers toward
