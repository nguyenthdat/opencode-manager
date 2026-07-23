# proj-avoid-circular-deps

> Design package boundaries to avoid import cycles

## Why It Matters

Go's compiler rejects import cycles outright - package A cannot import package B if B (transitively) imports A. Unlike some languages, there's no workaround via forward declarations or lazy loading; a cycle is a build error that forces you to restructure packages, usually by extracting the shared pieces into a third package both can depend on.

## Bad

```go
// package user
package user

import "example.com/myproject/order" // user imports order

type User struct {
	Orders []order.Order
}

// package order
package order

import "example.com/myproject/user" // order imports user - cycle!

type Order struct {
	Buyer user.User
}
// go build: import cycle not allowed
```

## Good: Extract the Shared Type

```go
// package model - holds shared types both user and order depend on
package model

type UserID string
type OrderID string

// package user
package user

import "example.com/myproject/model"

type User struct {
	ID     model.UserID
	Orders []model.OrderID // reference by ID, not by importing the order package directly
}

// package order
package order

import "example.com/myproject/model"

type Order struct {
	ID    model.OrderID
	Buyer model.UserID
}
```

## Good: Depend on an Interface Instead of a Concrete Type

```go
// package order defines only the interface it needs, not a dependency on
// the concrete user package - inverting the dependency direction.
package order

type Buyer interface {
	ID() string
}

type Order struct {
	Buyer Buyer
}
```

## Diagnosing a Cycle

```sh
go build ./...
# example.com/myproject/order
# imports example.com/myproject/user
# imports example.com/myproject/order: import cycle not allowed
```

## Rule of Thumb

Cycles usually indicate two packages that are actually one logical unit split incorrectly, or a case where a shared dependency (types, interfaces) belongs in its own package that both sides can depend on without depending on each other.

## See Also

- [proj-package-by-feature](proj-package-by-feature.md) - Organizing packages to naturally minimize cross-package coupling
- [api-small-interfaces](api-small-interfaces.md) - Interfaces as a tool for inverting a dependency direction
- [proj-internal-packages](proj-internal-packages.md) - Scoping shared internal types without exposing them publicly
