# api-table-driven-config

> Use a struct-based config over long positional parameter lists

## Why It Matters

A function with many parameters of the same or similar type (several `string`, several `bool`) is error-prone at the call site - it's easy to pass arguments in the wrong order, and the compiler can't catch it if the types happen to match. A config struct makes every value's meaning explicit at the call site via field names, and is trivially extensible without breaking existing callers.

## Bad

```go
func NewHTTPClient(timeout time.Duration, retries int, insecure bool, keepAlive bool, maxIdle int) *http.Client {
	// ...
	return &http.Client{}
}

// Which bool is which? Easy to transpose insecure and keepAlive by accident.
client := NewHTTPClient(30*time.Second, 3, false, true, 100)
```

## Good

```go
type ClientConfig struct {
	Timeout         time.Duration
	Retries         int
	InsecureSkipTLS bool
	KeepAlive       bool
	MaxIdleConns    int
}

func NewHTTPClient(cfg ClientConfig) *http.Client {
	// ...
	return &http.Client{Timeout: cfg.Timeout}
}

// Self-documenting at the call site, and safe to reorder fields or add new ones:
client := NewHTTPClient(ClientConfig{
	Timeout:      30 * time.Second,
	Retries:      3,
	KeepAlive:    true,
	MaxIdleConns: 100,
})
```

## Providing Sensible Defaults

```go
func DefaultClientConfig() ClientConfig {
	return ClientConfig{
		Timeout:      30 * time.Second,
		Retries:      3,
		MaxIdleConns: 100,
	}
}

cfg := DefaultClientConfig()
cfg.Timeout = 5 * time.Second // override just what's needed
client := NewHTTPClient(cfg)
```

## Config Struct vs. Functional Options

A config struct is simpler when every field is set together and the set of fields is stable. Functional options shine when you want to add new settings over time without breaking every existing call site, or when some options need validation logic bundled with them. Both solve the same "avoid a long parameter list" problem - pick based on how much the configuration surface is expected to grow.

## See Also

- [api-functional-options](api-functional-options.md) - The alternative pattern for evolving configuration
- [struct-init-keyed-fields](struct-init-keyed-fields.md) - Always using keyed fields, which this pattern depends on for clarity
- [struct-constructor-validation](struct-constructor-validation.md) - Validating the config struct's values before use
