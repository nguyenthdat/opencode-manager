# conc-context-cancel-propagate

> Propagate cancellation and deadlines through every downstream call

## Why It Matters

Accepting a `context.Context` is only useful if the function actually checks it and forwards it to every blocking call it makes. A function that accepts `ctx` but ignores it gives callers a false sense of control - timeouts won't fire and cancellation won't stop the work underneath.

## Bad

```go
func FetchAll(ctx context.Context, ids []string) ([]*User, error) {
	var users []*User
	for _, id := range ids {
		// ctx accepted but never used or forwarded - can't be cancelled or time out
		resp, err := http.Get(apiURL + "/users/" + id)
		if err != nil {
			return nil, err
		}
		users = append(users, parseUser(resp))
	}
	return users, nil
}
```

## Good

```go
func FetchAll(ctx context.Context, ids []string) ([]*User, error) {
	var users []*User
	for _, id := range ids {
		if err := ctx.Err(); err != nil {
			return nil, err // stop early if already cancelled/expired
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL+"/users/"+id, nil)
		if err != nil {
			return nil, err
		}
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return nil, err
		}
		users = append(users, parseUser(resp))
	}
	return users, nil
}
```

## Setting a Deadline at the Boundary

```go
func handler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	users, err := FetchAll(ctx, ids)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "upstream timeout", http.StatusGatewayTimeout)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, users)
}
```

## Rules

- Always call `cancel()` (via `defer`) for any `context.With*` you create, even if the context expires naturally, to release its resources immediately.
- Use `*Context` variants of stdlib calls (`http.NewRequestWithContext`, `db.QueryContext`) instead of the plain versions.
- Check `ctx.Err()` before starting expensive work in a loop, not just at the very top of the function.

## See Also

- [conc-context-first-param](conc-context-first-param.md) - Accepting context in the right position
- [conc-select-timeout](conc-select-timeout.md) - Using `ctx.Done()` inside `select` for cancellable blocking operations
- [http-client-timeout](http-client-timeout.md) - Complementary timeout configuration at the transport level
