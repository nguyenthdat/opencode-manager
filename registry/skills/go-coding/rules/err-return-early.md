# err-return-early

> Use guard clauses: return on error immediately instead of nesting the happy path

## Why It Matters

Nesting the success path inside `if err == nil { ... }` blocks grows deeper with every additional call, making the function harder to read and increasing cyclomatic complexity. Returning early on error keeps the function body flat, with the common case always at the leftmost indentation level.

## Bad

```go
func handle(req Request) error {
	if err := validate(req); err == nil {
		user, err := fetchUser(req.UserID)
		if err == nil {
			order, err := createOrder(user, req.Items)
			if err == nil {
				return notify(order)
			} else {
				return err
			}
		} else {
			return err
		}
	} else {
		return err
	}
}
```

## Good

```go
func handle(req Request) error {
	if err := validate(req); err != nil {
		return fmt.Errorf("validate request: %w", err)
	}

	user, err := fetchUser(req.UserID)
	if err != nil {
		return fmt.Errorf("fetch user %s: %w", req.UserID, err)
	}

	order, err := createOrder(user, req.Items)
	if err != nil {
		return fmt.Errorf("create order: %w", err)
	}

	return notify(order)
}
```

## Applies to Nil/Empty Checks Too

```go
func firstActive(users []User) (User, bool) {
	if len(users) == 0 {
		return User{}, false
	}
	for _, u := range users {
		if !u.Active {
			continue // guard clause inside the loop as well
		}
		return u, true
	}
	return User{}, false
}
```

## See Also

- [err-check-immediately](err-check-immediately.md) - Pairs directly with this guard-clause style
- [err-avoid-shadowing](err-avoid-shadowing.md) - A pitfall when reusing `err` across several guard clauses
- [anti-naked-return-abuse](anti-naked-return-abuse.md) - A different flow-control anti-pattern in long functions
