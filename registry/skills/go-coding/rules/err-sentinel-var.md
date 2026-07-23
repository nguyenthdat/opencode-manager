# err-sentinel-var

> Declare sentinel errors as package-level `var Err... = errors.New(...)`

## Why It Matters

Sentinel errors give callers a stable, comparable value to check for a specific well-known failure (e.g., "not found", "closed"), without depending on error message text. They should be exported when callers outside the package need to detect the condition.

## Bad

```go
func Get(id string) (*Item, error) {
	item, ok := store[id]
	if !ok {
		// Caller can only detect this by parsing the string - fragile
		return nil, errors.New("item " + id + " not found")
	}
	return item, nil
}

// Caller:
_, err := store.Get("42")
if err != nil && strings.Contains(err.Error(), "not found") {
	// brittle, breaks if the message wording changes
}
```

## Good

```go
package store

import "errors"

var ErrNotFound = errors.New("store: item not found")

func Get(id string) (*Item, error) {
	item, ok := items[id]
	if !ok {
		return nil, fmt.Errorf("get %s: %w", id, ErrNotFound)
	}
	return item, nil
}

// Caller:
_, err := store.Get("42")
if errors.Is(err, store.ErrNotFound) {
	// handle missing item
}
```

## Naming and Placement

- Name sentinel errors `Err<Reason>` (`ErrNotFound`, `ErrClosed`, `ErrTimeout`).
- Declare them near the top of the package, grouped in a single `var (...)` block if there are several.
- Keep the message lowercase and prefixed with the package name for context in logs: `"store: item not found"`.
- Only export a sentinel if external packages genuinely need to branch on it; keep purely internal ones unexported.

## Standard Library Examples

```go
io.EOF
sql.ErrNoRows
os.ErrNotExist
context.Canceled
context.DeadlineExceeded
```

## See Also

- [err-is-not-equality](err-is-not-equality.md) - Compare sentinel errors with `errors.Is`, not `==`
- [err-custom-type](err-custom-type.md) - Use a custom type instead when callers need structured data
- [err-wrap-fmt-w](err-wrap-fmt-w.md) - Wrap sentinels with `%w` to add context
