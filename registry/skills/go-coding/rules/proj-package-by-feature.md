# proj-package-by-feature

> Organize packages by feature/domain, not by technical layer

## Why It Matters

Grouping code by technical layer (`models/`, `controllers/`, `services/`) scatters everything related to one feature across several directories, so understanding or changing a single feature means jumping between many unrelated packages. Grouping by feature/domain (`user/`, `order/`, `billing/`) keeps everything related to one concern together, and naturally produces the small, focused packages Go idioms favor.

## Bad

```
myproject/
  models/
    user.go
    order.go
    invoice.go
  services/
    user_service.go
    order_service.go
    invoice_service.go
  handlers/
    user_handler.go
    order_handler.go
    invoice_handler.go
// Understanding "how orders work" means opening three different directories,
// and every layer package imports every model package - a recipe for coupling.
```

## Good

```
myproject/
  user/
    user.go        // type User struct { ... }
    service.go      // business logic operating on User
    handler.go       // HTTP handlers for user endpoints
  order/
    order.go
    service.go
    handler.go
  billing/
    invoice.go
    service.go
    handler.go
// Everything related to "order" lives in one place; a change to how orders
// work touches one directory, not three.
```

## Cross-Feature Dependencies Become Explicit

```go
package order

import "example.com/myproject/user" // order explicitly depends on user - visible at a glance

type Order struct {
	Buyer user.User
}
```

When packages are organized by layer instead, this same dependency is implicit and spread across `models`, `services`, and `handlers` simultaneously, making the actual dependency graph much harder to see.

## When Layer-Based Grouping Still Makes Sense

For a small project where there's really only one "feature" (a single CRUD resource, a single CLI tool), layering by technical concern (or not splitting at all - see `proj-flat-small-packages`) can be simpler than inventing a feature boundary that doesn't yet exist.

## See Also

- [proj-avoid-circular-deps](proj-avoid-circular-deps.md) - Feature-based packages naturally reduce the risk of cycles
- [proj-standard-layout](proj-standard-layout.md) - Where feature packages fit within the overall project layout
- [proj-flat-small-packages](proj-flat-small-packages.md) - When splitting by feature is premature
