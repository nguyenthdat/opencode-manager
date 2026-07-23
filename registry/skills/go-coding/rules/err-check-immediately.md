# err-check-immediately

> Check an error immediately after the call that can produce it

## Why It Matters

Delaying an error check - storing it, continuing to use a possibly-invalid result, or checking several calls' errors at once - makes it easy to use zero-value or partially-initialized data by mistake, and obscures exactly which call failed.

## Bad

```go
func loadUser(id string) *User {
	data, err1 := fetchData(id)
	parsed, err2 := parseUser(data) // uses data even if fetchData failed
	saved, err3 := cache.Set(id, parsed)
	if err1 != nil || err2 != nil || err3 != nil {
		log.Println("something failed") // which one? data may be garbage by now
		return nil
	}
	return saved
}
```

## Good

```go
func loadUser(id string) (*User, error) {
	data, err := fetchData(id)
	if err != nil {
		return nil, fmt.Errorf("fetch data for %s: %w", id, err)
	}

	parsed, err := parseUser(data)
	if err != nil {
		return nil, fmt.Errorf("parse user %s: %w", id, err)
	}

	if err := cache.Set(id, parsed); err != nil {
		return nil, fmt.Errorf("cache user %s: %w", id, err)
	}
	return parsed, nil
}
```

## The Idiomatic Shape

```go
result, err := doSomething()
if err != nil {
	return err // or handle it - but do it right here, right after the call
}
use(result)
```

This "check, then use" ordering is the single most repeated shape in Go code, and tooling (`errcheck`, `go vet`) and reviewers both expect it. Deviating from it - even briefly - is a common source of bugs.

## See Also

- [err-no-ignore](err-no-ignore.md) - The check must actually happen, not just be adjacent
- [err-return-early](err-return-early.md) - What to do once the check fails
- [err-avoid-shadowing](err-avoid-shadowing.md) - A common mistake when checking multiple errors with `:=`
