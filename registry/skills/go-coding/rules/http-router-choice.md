# http-router-choice

> Choose your router deliberately: stdlib `ServeMux` (1.22+) is often enough

## Why It Matters

Go's standard `net/http.ServeMux`, as of Go 1.22, gained method-aware routing and wildcard path segments (`GET /users/{id}`), closing most of the gap that used to justify reaching for a third-party router (`chi`, `gorilla/mux`, `gin`) by default. Choosing the stdlib router when it's sufficient avoids an extra dependency; choosing a third-party router when you genuinely need its extra features (nested route groups, regex constraints, built-in middleware ecosystems) is equally legitimate - the mistake is picking one without knowing which extra features you actually need.

## Bad

```go
// Reaching for a heavyweight third-party router/framework for a handful of
// simple, static routes with no special requirements - unnecessary dependency
// for what the standard library now covers directly.
r := gin.Default()
r.GET("/health", healthHandler)
r.GET("/users/:id", getUserHandler)
r.Run(":8080")
```

## Good: Stdlib `ServeMux` (Go 1.22+)

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /health", handleHealth)
mux.HandleFunc("GET /users/{id}", handleGetUser)
mux.HandleFunc("POST /users", handleCreateUser)
mux.HandleFunc("GET /users/{id}/orders/{orderID}", handleGetOrder)

http.ListenAndServe(":8080", mux)
```

```go
func handleGetUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id") // built-in wildcard extraction, no third-party router needed
	// ...
}
```

## When a Third-Party Router Is the Right Call

```go
// chi, for example, adds route grouping, built-in middleware chaining
// conventions, and a large existing middleware ecosystem:
r := chi.NewRouter()
r.Use(middleware.Logger, middleware.Recoverer)
r.Route("/users", func(r chi.Router) {
	r.Get("/{id}", handleGetUser)
	r.Post("/", handleCreateUser)
})
```

Reach for a third-party router when you need: nested route groups with shared middleware, regex-constrained path segments, a mature middleware ecosystem you don't want to hand-roll, or a team's existing convention already built around one.

## Decision Guide

| Need | Stdlib `ServeMux` (1.22+) | Third-party router |
|---|---|---|
| Method + wildcard path routing | Yes | Yes |
| Route grouping/nesting with shared middleware | No | Yes |
| Regex/typed path constraints | No | Often |
| Zero extra dependencies | Yes | No |

## See Also

- [http-handler-signature](http-handler-signature.md) - The `http.Handler` shape either routing choice is built around
- [http-middleware-chaining](http-middleware-chaining.md) - Composing middleware regardless of router choice
- [proj-module-hygiene](proj-module-hygiene.md) - Weighing a new dependency's cost before adding a router
