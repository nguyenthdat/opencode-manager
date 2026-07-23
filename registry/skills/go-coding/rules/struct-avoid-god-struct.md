# struct-avoid-god-struct

> Avoid a single struct that accumulates every field the whole program touches

## Why It Matters

A "god struct" - one type with dozens of fields spanning unrelated concerns (config, database handles, caches, feature flags, request-scoped state) - couples every piece of code that touches any one of those fields to the entire type. Changes to one concern risk breaking unrelated code that happens to share the same struct, and the struct's size makes it hard to reason about which fields any given function actually needs.

## Bad

```go
type App struct {
	DB              *sql.DB
	Cache           *redis.Client
	Logger          *slog.Logger
	Config          Config
	UserService     *UserService
	OrderService    *OrderService
	BillingService  *BillingService
	EmailClient     *EmailClient
	FeatureFlags    map[string]bool
	CurrentRequest  *http.Request // request-scoped state mixed into a long-lived app struct!
	CurrentUser     *User          // same problem: doesn't belong at this scope at all
}

func handleOrder(app *App) { // depends on the ENTIRE App, even though it only needs two of its fields
	app.OrderService.Create(app.CurrentUser, app.CurrentRequest)
}
```

## Good

```go
type App struct { // long-lived, process-scoped dependencies only
	DB     *sql.DB
	Cache  *redis.Client
	Logger *slog.Logger
	Config Config
}

type Services struct { // grouped by what they actually are: a set of related services
	Users   *UserService
	Orders  *OrderService
	Billing *BillingService
	Email   *EmailClient
}

func handleOrder(orders *OrderService, user *User, r *http.Request) { // depends on exactly what it needs
	orders.Create(user, r)
}
```

## Splitting by Lifetime and Concern

```go
// Process-scoped (constructed once at startup):
type App struct {
	DB     *sql.DB
	Logger *slog.Logger
}

// Request-scoped (constructed per request, never stored long-term):
type RequestContext struct {
	User  *User
	Trace string
}
```

Mixing process-scoped and request-scoped state in the same struct is a common way god structs form - keep them as separate types with separate, clear lifetimes.

## Rule of Thumb

If a struct's fields don't all change together, aren't all needed by the same set of callers, and don't share an obvious lifetime, they probably belong in separate types - even if it's momentarily convenient to have "everything in one place."

## See Also

- [proj-package-by-feature](proj-package-by-feature.md) - Splitting by feature naturally prevents a god struct from forming across packages
- [api-small-interfaces](api-small-interfaces.md) - The same "depend on exactly what you need" principle applied to interfaces
- [struct-nested-vs-flat](struct-nested-vs-flat.md) - Deciding how to group related fields once you've split them out
