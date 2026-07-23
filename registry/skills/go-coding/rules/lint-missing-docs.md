# lint-missing-docs

> Enforce doc comments on every exported identifier via linting

## Why It Matters

Nothing in the compiler requires an exported type, function, or constant to have a doc comment - a package can export a large API with zero documentation and still build and pass every test. Enforcing doc-comment presence via a linter (`revive`'s `exported` rule, or `golangci-lint`'s equivalent) turns "please document your public API" from a code-review nag into an automated, consistently-applied gate.

## Bad

```go
package cache

type Cache struct { // no doc comment - a consumer has no idea what this does without reading the source
	data map[string]string
}

func New() *Cache { return &Cache{data: map[string]string{}} } // also undocumented

func (c *Cache) Get(key string) (string, bool) { // also undocumented
	v, ok := c.data[key]
	return v, ok
}
```

## Good

```go
package cache

// Cache is a simple, non-expiring in-memory key/value store.
// It is not safe for concurrent use without external synchronization.
type Cache struct {
	data map[string]string
}

// New returns an empty, ready-to-use Cache.
func New() *Cache { return &Cache{data: map[string]string{}} }

// Get returns the value for key and reports whether it was present.
func (c *Cache) Get(key string) (string, bool) {
	v, ok := c.data[key]
	return v, ok
}
```

## Enabling the Check

```yaml
# .golangci.yml
linters:
  enable:
    - revive
linters-settings:
  revive:
    rules:
      - name: exported
        arguments:
          - "checkPrivateReceivers"
          - "sayRepetitiveInsteadOfStutters"
```

```sh
golangci-lint run ./...
# cache.go:3:1: exported type Cache should have comment or be unexported
# cache.go:8:1: exported function New should have comment or be unexported
```

## Applying This Selectively

For internal-only packages (everything under `internal/`), requiring full doc comments on every exported identifier is sometimes considered excessive, since nothing outside the module can ever consume them anyway - some teams scope this rule to only the module's true public API packages. Either choice is reasonable; the important thing is deciding deliberately rather than leaving public API documentation entirely to individual discipline.

## See Also

- [doc-comment-starts-with-name](doc-comment-starts-with-name.md) - The exact comment format this check verifies is followed
- [lint-revive-style](lint-revive-style.md) - The broader linter this specific rule is one part of
- [api-minimal-exported-surface](api-minimal-exported-surface.md) - Keeping the exported surface small reduces how much documentation this rule requires
