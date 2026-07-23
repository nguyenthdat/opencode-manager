# http-middleware-chaining

> Chain `http.Handler` middleware in a clear, explicit order

## Why It Matters

Middleware order matters - a recovery middleware placed after (inside) a logging middleware won't protect the logging call itself from a panic, and an auth check placed after a body-parsing middleware might do unnecessary work on unauthenticated requests. Writing each middleware as `func(http.Handler) http.Handler` and composing them explicitly, outermost-first, makes the order visible and easy to reason about at a glance.

## Bad

```go
// Order is buried in nested function calls, hard to read and easy to get wrong:
handler := withLogging(withAuth(withRecovery(withTimeout(5*time.Second)(mux))))
// Reading right-to-left/inside-out to figure out actual request-processing order
// is unnecessarily hard, and recovery being innermost means a panic in withAuth
// or withLogging itself is NOT caught.
```

## Good

```go
type Middleware func(http.Handler) http.Handler

func chain(h http.Handler, mws ...Middleware) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- { // apply in reverse so the first middleware listed runs first
		h = mws[i](h)
	}
	return h
}

handler := chain(mux,
	withRecovery,             // outermost: catches panics from every middleware below it too
	withLogging,
	withTimeout(5*time.Second),
	withAuth,
)
http.ListenAndServe(":8080", handler)
```

## A Typical, Well-Reasoned Order

```go
handler := chain(mux,
	withRecovery,   // 1. catch panics from everything below - must be outermost
	withLogging,    // 2. log every request/response, including ones later middleware rejects
	withTimeout(d), // 3. bound the whole remaining chain's execution time
	withAuth,       // 4. reject unauthenticated requests before touching business logic
)
```

## Per-Route Middleware vs. Global Middleware

```go
mux := http.NewServeMux()
mux.Handle("GET /public", publicHandler)                       // no auth middleware needed
mux.Handle("GET /admin", withAuth(adminHandler))                // auth applied only to this route

handler := chain(mux, withRecovery, withLogging) // global middleware applies to every route via mux
```

## See Also

- [http-handler-signature](http-handler-signature.md) - The `http.Handler`/`http.HandlerFunc` shape middleware wraps
- [err-recover-boundary](err-recover-boundary.md) - The recovery middleware's role as a panic boundary
- [http-context-timeout-middleware](http-context-timeout-middleware.md) - A specific middleware commonly included in this chain
