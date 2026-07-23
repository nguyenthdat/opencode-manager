# conc-context-first-param

> Pass `context.Context` as the first parameter, named `ctx`

## Why It Matters

`context.Context` carries cancellation, deadlines, and request-scoped values across API boundaries and between goroutines. Go convention places it as the first parameter of any function that does I/O, blocks, or spawns work, so every caller and reader immediately recognizes which calls are cancellable and can be traced through a call graph consistently.

## Bad

```go
func FetchUser(id string, ctx context.Context) (*User, error) { ... } // wrong position

func FetchUser(id string) (*User, error) { // no way to cancel or bound this call
	return db.QueryUser(id)
}

type Service struct {
	ctx context.Context // storing ctx on a struct instead of passing it - see anti-context-in-struct
}
```

## Good

```go
func FetchUser(ctx context.Context, id string) (*User, error) {
	row := db.QueryRowContext(ctx, "SELECT * FROM users WHERE id = ?", id)
	return scanUser(row)
}

func (s *Service) Process(ctx context.Context, req Request) (Response, error) {
	if err := ctx.Err(); err != nil {
		return Response{}, err
	}
	return s.doWork(ctx, req)
}
```

## Consistency Across a Call Chain

```go
func handler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, err := FetchUser(ctx, r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, user)
}
```

## Rules

- `ctx` is always the first parameter, never bundled into a struct or options type.
- Never pass a nil `context.Context`; use `context.TODO()` if no context is available yet (e.g., during migration), not `nil`.
- Don't put business data in a context - only cross-cutting request-scoped values (trace IDs, deadlines).

## See Also

- [conc-context-cancel-propagate](conc-context-cancel-propagate.md) - Actually respecting the context passed in
- [anti-context-in-struct](anti-context-in-struct.md) - Why storing `ctx` on a struct is discouraged
- [name-context-var-ctx](name-context-var-ctx.md) - Naming convention for context variables
