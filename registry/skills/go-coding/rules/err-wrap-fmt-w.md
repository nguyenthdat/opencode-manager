# err-wrap-fmt-w

> Wrap errors with `fmt.Errorf("...: %w", err)` to preserve the chain

## Why It Matters

Wrapping an error with `%w` preserves the original error so callers can inspect it with `errors.Is`/`errors.As`, while still adding context about where and why it failed. Using `%v` or string concatenation destroys the underlying error, forcing callers to parse strings to understand failures.

## Bad

```go
func loadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		// Original error is lost - can't check for os.ErrNotExist upstream
		return nil, fmt.Errorf("failed to load config: %v", err)
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, errors.New("failed to parse config: " + err.Error())
	}
	return &cfg, nil
}
```

## Good

```go
func loadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config %s: %w", path, err)
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parse config %s: %w", path, err)
	}
	return &cfg, nil
}

// Caller can still detect the root cause:
cfg, err := loadConfig("app.json")
if errors.Is(err, os.ErrNotExist) {
	cfg = defaultConfig()
}
```

## Wrapping Multiple Errors

```go
// Go 1.20+: %w can appear multiple times, combined via errors.Join semantics
if err := fmt.Errorf("step1: %w, step2: %w", err1, err2); err != nil {
	// errors.Is/errors.As will find either err1 or err2
}
```

## Context Guidelines

- Add *what operation was being attempted*, not a restatement of the error text.
- Include identifying values (a path, an ID) that help locate the failure.
- Don't wrap the same error at every layer with redundant text; add value at each hop.

## See Also

- [err-is-not-equality](err-is-not-equality.md) - Use `errors.Is` to check wrapped sentinel errors
- [err-as-type-assert](err-as-type-assert.md) - Use `errors.As` to extract wrapped custom error types
- [err-custom-type](err-custom-type.md) - Custom error types that support wrapping via `Unwrap()`
