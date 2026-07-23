# http-handler-signature

> Write handlers as `func(http.ResponseWriter, *http.Request)`, wired via `http.Handler`

## Why It Matters

`http.Handler`/`http.HandlerFunc` is the foundational interface every Go HTTP tool (the standard library, routers, middleware, testing helpers) is built around. Writing handlers in this exact shape - rather than a custom signature - means your handlers compose with any router, any middleware, and `httptest`, without adapter code.

## Bad

```go
func getUser(id string) (User, int) { // custom signature: incompatible with http.Handler, routers, middleware
	// ...
	return User{}, http.StatusOK
}

// Requires bespoke glue code at every call site to bridge to net/http:
http.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	user, status := getUser(id)
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(user)
})
```

## Good

```go
func handleGetUser(store UserStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id") // Go 1.22+ built-in path parameters
		user, err := store.FindByID(r.Context(), id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	}
}

mux := http.NewServeMux()
mux.Handle("GET /users/{id}", handleGetUser(store)) // composes directly with the stdlib router
```

## Returning `http.Handler` for Composability With Middleware

```go
func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

handler := withLogging(mux) // any http.Handler can wrap any other http.Handler
http.ListenAndServe(":8080", handler)
```

## Injecting Dependencies via a Closure, Not Package Globals

```go
// Prefer a constructor returning a closure over the handler depending on a
// package-level variable (see api-avoid-global-state) for its dependencies.
func handleCreateOrder(store OrderStore, notifier Notifier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// store and notifier are available via closure, not global state
	}
}
```

## See Also

- [http-middleware-chaining](http-middleware-chaining.md) - Composing multiple `http.Handler` wrappers together
- [test-httptest-server](test-httptest-server.md) - Testing this exact handler shape directly with `httptest`
- [api-avoid-global-state](api-avoid-global-state.md) - Why dependencies are injected via closure here instead of package globals
