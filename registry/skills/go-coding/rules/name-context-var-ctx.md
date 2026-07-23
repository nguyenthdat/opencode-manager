# name-context-var-ctx

> Name `context.Context` variables and parameters `ctx`

## Why It Matters

`ctx` is the universal, instantly-recognizable name for a context value across the entire Go ecosystem. Using anything else (`context`, `c`, `cancelCtx`) forces a reader to double-check what the variable actually is, especially since `c` is also commonly used for other receivers and `context` shadows the package name itself.

## Bad

```go
func FetchUser(context context.Context, id string) (*User, error) { // shadows the package name "context"
	return db.QueryUser(context, id)
}

func Process(c context.Context, req Request) error { // "c" is ambiguous with a receiver name
	return handle(c, req)
}
```

## Good

```go
func FetchUser(ctx context.Context, id string) (*User, error) {
	return db.QueryUser(ctx, id)
}

func Process(ctx context.Context, req Request) error {
	return handle(ctx, req)
}
```

## Derived Contexts Keep a Descriptive Suffix

```go
func handler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	timeoutCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	traceCtx := context.WithValue(timeoutCtx, traceIDKey{}, generateTraceID())
	process(traceCtx, req)
}
```

Even derived contexts keep `ctx` as part of the name (`timeoutCtx`, `traceCtx`) rather than switching to something unrelated, so the reader can still tell at a glance that it's a context value.

## See Also

- [conc-context-first-param](conc-context-first-param.md) - Where `ctx` belongs in a function signature
- [name-error-var-err](name-error-var-err.md) - The equivalent naming convention for error values
- [anti-context-in-struct](anti-context-in-struct.md) - Why `ctx` should stay a parameter, not become a struct field
