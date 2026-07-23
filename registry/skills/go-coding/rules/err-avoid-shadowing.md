# err-avoid-shadowing

> Be careful when `:=` shadows an outer `err` in a nested block

## Why It Matters

`if x, err := f(); err != nil` inside an `if`/`for` block creates a *new* `err` scoped to that block. If you meant to update the outer `err` (e.g., for a named return or a variable checked afterward), the shadowed variable silently discards the result, and the outer `err` stays `nil`.

## Bad

```go
func process() (err error) {
	if data, err := fetch(); err != nil { // shadows the named return `err`
		return err // this return is fine locally...
	} else {
		save(data)
	}
	return err // ...but this refers to the OUTER err, which is still nil!
}

func loadAll(paths []string) error {
	var err error
	for _, p := range paths {
		if data, err := os.ReadFile(p); err != nil { // shadowed - loop variable, not outer
			log.Println(err)
		} else {
			process(data)
		}
	}
	return err // always nil, regardless of failures above
}
```

## Good

```go
func process() (err error) {
	var data []byte
	data, err = fetch() // assign to the outer err explicitly, no shadowing
	if err != nil {
		return err
	}
	return save(data)
}

func loadAll(paths []string) error {
	for _, p := range paths {
		data, err := os.ReadFile(p) // fine: scoped err, checked and returned immediately
		if err != nil {
			return fmt.Errorf("read %s: %w", p, err)
		}
		if err := process(data); err != nil {
			return fmt.Errorf("process %s: %w", p, err)
		}
	}
	return nil
}
```

## Rule of Thumb

Shadowing `err` inside a block is fine *as long as you fully handle it inside that block* (return it, log it, or otherwise act on it). It becomes a bug only when you rely on some outer `err` variable being updated by a shadowed inner assignment. `go vet -shadow` (via `golangci-lint`'s `shadow` check) flags these cases.

## See Also

- [err-check-immediately](err-check-immediately.md) - Checking immediately reduces the chance of relying on stale outer state
- [lint-shadow-check](lint-shadow-check.md) - Linter configuration that catches variable shadowing
- [err-return-early](err-return-early.md) - Guard-clause style that naturally avoids this trap
