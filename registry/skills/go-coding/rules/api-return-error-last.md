# api-return-error-last

> Return `error` as the last value in a multi-value return

## Why It Matters

Every Go developer expects `(result, err)` ordering - it's used consistently throughout the standard library and virtually every third-party package. Deviating from it (`(err, result)` or interleaving errors among other values) breaks the pattern-matching intuition callers rely on and makes `if err != nil` checks read unnaturally.

## Bad

```go
func ParseConfig(path string) (error, *Config) { // error first - breaks convention
	data, err := os.ReadFile(path)
	if err != nil {
		return err, nil
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return err, nil
	}
	return nil, &cfg
}

// Reads awkwardly at the call site:
err, cfg := ParseConfig("app.json")
```

## Good

```go
func ParseConfig(path string) (*Config, error) { // error last - matches every stdlib convention
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config: %w", err)
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}
	return &cfg, nil
}

cfg, err := ParseConfig("app.json")
if err != nil {
	return err
}
```

## Multiple Values Plus Error

```go
func Divmod(a, b int) (quotient, remainder int, err error) { // error still last
	if b == 0 {
		return 0, 0, errors.New("divmod: division by zero")
	}
	return a / b, a % b, nil
}
```

## Consistency Enables Idiomatic Patterns

The convention is what makes patterns like the comma-ok idiom and immediate guard clauses feel uniform across an entire codebase:

```go
if v, err := f(); err != nil {
	return err
} else {
	use(v)
}
```

`go vet` and most linters assume this ordering when analyzing error-returning functions; deviating from it can also confuse tools that special-case the last return value as the error.

## See Also

- [err-return-early](err-return-early.md) - The guard-clause style this convention enables
- [err-check-immediately](err-check-immediately.md) - Checking the returned error right away
- [name-error-var-err](name-error-var-err.md) - Naming the error variable itself
