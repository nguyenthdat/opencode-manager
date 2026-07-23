# anti-panic-recover-control-flow

> Don't use `panic`/`recover` as a substitute for normal control flow

## Why It Matters

`panic`/`recover` in Go is analogous to exceptions in other languages, but Go's own idiom deliberately avoids using it for expected, recoverable conditions - error values and explicit checks are the idiomatic control-flow mechanism. Using `panic` to "jump out" of nested logic (instead of returning an error or a sentinel value) makes control flow implicit, harder to trace, and inconsistent with how every other Go function in the ecosystem reports failure.

## Bad

```go
func findUser(users []User, id string) User {
	for _, u := range users {
		if u.ID == id {
			panic(FoundUser{u}) // "throwing" the result instead of returning it - control flow via panic
		}
	}
	panic("not found")
}

func lookup(users []User, id string) (result User, err error) {
	defer func() {
		if r := recover(); r != nil {
			if found, ok := r.(FoundUser); ok {
				result = found.User
				return
			}
			err = errors.New("not found")
		}
	}()
	result = findUser(users, id) // relies on panic/recover for what should be a simple return
	return
}
```

## Good

```go
func findUser(users []User, id string) (User, bool) {
	for _, u := range users {
		if u.ID == id {
			return u, true // ordinary early return - no panic needed
		}
	}
	return User{}, false
}

func lookup(users []User, id string) (User, error) {
	u, ok := findUser(users, id)
	if !ok {
		return User{}, fmt.Errorf("user %s not found", id)
	}
	return u, nil
}
```

## Where Panic-Based "Unwinding" Is Occasionally Accepted

A small number of standard-library-adjacent patterns (some recursive-descent parsers) use an internal `panic`/`recover` pair to unwind deeply nested recursive calls on a fatal internal error, with the `recover` strictly confined to the top of the parse function and never exposed across a package boundary. This is a narrow, deliberate implementation technique for a specific class of problem (deep, mutually-recursive descent) - it is not a general substitute for returning errors from ordinary application logic.

## Rule of Thumb

If you're using `panic` to communicate anything other than "the program has a bug," and `recover` to turn that back into a normal value, you're very likely fighting the language's idioms rather than working with them - restructure to use ordinary return values instead.

## See Also

- [err-panic-programmer-bugs](err-panic-programmer-bugs.md) - What panic should actually be reserved for
- [err-recover-boundary](err-recover-boundary.md) - The one legitimate place `recover` belongs: a goroutine/request boundary
- [type-avoid-panic-in-library](type-avoid-panic-in-library.md) - Why library code specifically must not do this
