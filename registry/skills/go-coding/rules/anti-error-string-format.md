# anti-error-string-format

> Don't build wrapped errors with `%v`/string concatenation when `%w` is intended

## Why It Matters

`fmt.Errorf("...: %v", err)` and `fmt.Errorf("..." + err.Error())` both produce a new error whose text mentions the original error, but neither preserves the original error *value* - `errors.Is`/`errors.As` cannot find it, because there's no `Unwrap()` chain connecting the new error back to the original. This looks correct (the message reads fine in logs) but silently breaks every caller that needs to detect a specific underlying failure.

## Bad

```go
func loadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to load config: %v", err) // %v, not %w - breaks the chain
	}
	// ...
	return nil, nil
}

cfg, err := loadConfig("missing.json")
if errors.Is(err, os.ErrNotExist) { // always false: the chain was broken by %v above
	cfg = defaultConfig()
}
```

## Good

```go
func loadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("load config %s: %w", path, err) // %w preserves the chain
	}
	// ...
	return nil, nil
}

cfg, err := loadConfig("missing.json")
if errors.Is(err, os.ErrNotExist) { // correctly true now
	cfg = defaultConfig()
}
```

## When `%v` Is Actually the Right Choice

```go
// Deliberately hiding the underlying error from callers (e.g., not wanting to
// leak an internal implementation detail through a public API's error chain)
// is a valid reason to use %v instead of %w - just do it knowingly, not by accident:
func PublicAPI() error {
	if err := internalCall(); err != nil {
		return fmt.Errorf("public operation failed: %v", err) // deliberately not exposing the internal error type
	}
	return nil
}
```

## Catching This in Review

The tell is any `fmt.Errorf` call whose format string contains `%v` (or `%s`) immediately following a colon, applied to an `error`-typed argument - that's almost always meant to be `%w` unless there's a specific, deliberate reason to break the chain.

## See Also

- [err-wrap-fmt-w](err-wrap-fmt-w.md) - The correct pattern this anti-pattern fails to follow
- [err-is-not-equality](err-is-not-equality.md) - Why `errors.Is` depends on the chain `%w` preserves
- [err-as-type-assert](err-as-type-assert.md) - The equivalent breakage for `errors.As` when a custom error type is involved
