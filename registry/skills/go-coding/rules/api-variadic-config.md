# api-variadic-config

> Use variadic parameters for optional trailing arguments, not for required ones

## Why It Matters

A variadic parameter (`...T`) is a good fit for "zero or more of the same kind of thing" - options, extra values to log, additional filters. Using it as a workaround to make a required argument feel optional, or to accept a loosely-typed grab-bag of mixed values, produces call sites that compile with the wrong number (or absence) of arguments and only fail at runtime.

## Bad

```go
func Connect(addr string, opts ...string) (*Conn, error) {
	// "opts" is really "username, password, database" positionally - callers
	// have to know the order, and passing 2 or 4 strings compiles fine either way
	if len(opts) > 0 {
		username := opts[0]
		_ = username
	}
	// ...
	return nil, nil
}

Connect("localhost:5432", "admin")            // missing password? compiles fine
Connect("localhost:5432", "admin", "secret", "extra", "??") // also compiles fine
```

## Good

```go
type ConnOption func(*connConfig)

func WithCredentials(user, pass string) ConnOption {
	return func(c *connConfig) { c.user, c.pass = user, pass }
}

func WithDatabase(name string) ConnOption {
	return func(c *connConfig) { c.database = name }
}

func Connect(addr string, opts ...ConnOption) (*Conn, error) {
	cfg := &connConfig{database: "postgres"}
	for _, opt := range opts {
		opt(cfg)
	}
	return dial(addr, cfg)
}

Connect("localhost:5432", WithCredentials("admin", "secret"), WithDatabase("app"))
```

## Where Variadic Parameters Are the Right Tool

```go
func Sum(nums ...int) int { // genuinely "zero or more values of the same kind"
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}

func Printf(format string, args ...any) { /* ... */ } // stdlib convention for format args

func Filter(items []Item, preds ...func(Item) bool) []Item { // zero or more predicates
	// ...
	return items
}
```

## Rule of Thumb

If the "optional" values have distinct meanings (not interchangeable instances of the same concept), use functional options or a config struct instead of a variadic parameter - variadic is for homogeneous, order-independent repetition, not a substitute for named parameters.

## See Also

- [api-functional-options](api-functional-options.md) - The correct pattern for heterogeneous optional configuration
- [api-table-driven-config](api-table-driven-config.md) - A struct-based alternative for the same problem
- [type-defined-types-safety](type-defined-types-safety.md) - Making required parameters unambiguous via distinct types
