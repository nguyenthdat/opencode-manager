# http-context-timeout-middleware

> Apply a request-scoped timeout via middleware, not ad hoc per-handler code

## Why It Matters

Without an enforced deadline, a single slow downstream call (a stuck database query, a hanging upstream API) can hold a request open indefinitely, tying up a goroutine and file descriptor while a client waits far longer than any reasonable UX allows. Applying a timeout centrally, in middleware, guarantees every handler behind it inherits a bounded `context.Context` without each one having to remember to set it up individually.

## Bad

```go
func handleGetUser(w http.ResponseWriter, r *http.Request) {
	// No timeout at all - if fetchUser hangs, this goroutine (and the
	// underlying connection) is held open for as long as fetchUser takes.
	user, err := fetchUser(r.Context(), r.PathValue("id"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(user)
}
```

## Good

```go
func withTimeout(d time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, cancel := context.WithTimeout(r.Context(), d)
			defer cancel()
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

mux := http.NewServeMux()
mux.HandleFunc("GET /users/{id}", handleGetUser)
handler := withTimeout(5 * time.Second)(mux) // every request behind this gets a 5s deadline
http.ListenAndServe(":8080", handler)
```

```go
func handleGetUser(w http.ResponseWriter, r *http.Request) {
	user, err := fetchUser(r.Context(), r.PathValue("id")) // inherits the middleware's deadline automatically
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "request timed out", http.StatusGatewayTimeout)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(user)
}
```

## `http.TimeoutHandler` as a Built-In Alternative

```go
handler := http.TimeoutHandler(mux, 5*time.Second, "request timed out")
// Cancels the request's context and returns the given body/504 status if the
// handler doesn't finish within the duration - simpler, but offers less
// control over the response format than the custom middleware above.
```

## Rules

- Set the timeout at the layer that knows the acceptable end-to-end latency budget (often an outer middleware, not deep inside business logic).
- Always propagate the resulting `ctx` into every downstream call (`conc-context-cancel-propagate`) - a timeout middleware that sets a deadline nobody checks accomplishes nothing.

## See Also

- [conc-context-cancel-propagate](conc-context-cancel-propagate.md) - Making sure downstream calls actually respect this deadline
- [http-middleware-chaining](http-middleware-chaining.md) - Composing this middleware with others (logging, auth, recovery)
- [http-graceful-shutdown](http-graceful-shutdown.md) - The complementary server-lifecycle timeout concern
