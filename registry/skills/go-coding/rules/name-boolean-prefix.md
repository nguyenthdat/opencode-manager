# name-boolean-prefix

> Prefix boolean variables and methods with `Is`, `Has`, `Can`, or similar

## Why It Matters

A boolean named without a question-like prefix (`active`, `valid`, `enabled`) reads ambiguously in isolation - is it a command, a state, a flag someone should set? Prefixing with `Is`/`Has`/`Can`/`Should` makes every boolean read like the yes/no question it represents, at the declaration and at every call site.

## Bad

```go
type User struct {
	active  bool
	admin   bool
	deleted bool
}

func (u *User) valid() bool { return u.active && !u.deleted }

if u.admin { // reads like it could be an assignment target, not obviously a question
	grantAccess()
}
```

## Good

```go
type User struct {
	isActive  bool
	isAdmin   bool
	isDeleted bool
}

func (u *User) IsValid() bool { return u.isActive && !u.isDeleted }

if u.isAdmin {
	grantAccess()
}
```

## Common Prefixes and What They Imply

```go
IsActive    bool // a state
HasChildren bool // possession/containment
CanEdit     bool // permission/capability
ShouldRetry bool // a recommendation/decision
```

## Function Names Follow the Same Pattern

```go
func IsValidEmail(s string) bool              { /* ... */ return true }
func HasPermission(u User, p Permission) bool { /* ... */ return true }
func CanTransition(from, to State) bool       { /* ... */ return true }
```

## Negatives Are Harder to Read - Avoid Double Negatives

```go
// Avoid naming a boolean so that checking it requires double-negation to understand:
isNotDisabled := true
if !isNotDisabled { /* ... */ } // confusing - two negatives to parse

// Prefer the positive form:
isEnabled := true
if !isEnabled { /* ... */ }
```

## See Also

- [name-no-get-prefix](name-no-get-prefix.md) - The equivalent convention for non-boolean accessors
- [name-mixedcaps](name-mixedcaps.md) - The general casing convention this naming pattern follows
- [type-zero-value-useful](type-zero-value-useful.md) - Designing boolean fields so their zero value (`false`) is the sensible default
