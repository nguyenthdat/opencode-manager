# name-error-var-err

> Name error variables `err`, consistently

## Why It Matters

Using `err` uniformly for error values is one of the strongest naming conventions in Go - readers scan for `if err != nil` reflexively, and any deviation (`error1`, `e`, `problem`) forces extra cognitive effort to confirm it's the same kind of value being checked the same way everywhere else.

## Bad

```go
func process() error {
	data, e := fetch() // "e" instead of "err" - inconsistent with the rest of the codebase
	if e != nil {
		return e
	}

	problem := validate(data) // not even named like an error at all
	if problem != nil {
		return problem
	}
	return nil
}
```

## Good

```go
func process() error {
	data, err := fetch()
	if err != nil {
		return err
	}

	if err := validate(data); err != nil {
		return err
	}
	return nil
}
```

## Multiple Distinct Errors in the Same Scope

```go
func closeAll(a, b io.Closer) error {
	errA := a.Close() // when you must distinguish two errors in the same scope,
	errB := b.Close() // suffix with what each one is about, keeping "err" as the base
	return errors.Join(errA, errB)
}
```

## Named Return Values

```go
func writeFile(path string, data []byte) (err error) { // named return still called "err"
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer func() {
		if cerr := f.Close(); cerr != nil && err == nil {
			err = cerr
		}
	}()
	_, err = f.Write(data)
	return err
}
```

## See Also

- [err-avoid-shadowing](err-avoid-shadowing.md) - A pitfall specific to reusing `err` across nested scopes
- [name-context-var-ctx](name-context-var-ctx.md) - The equivalent convention for `context.Context` variables
- [err-check-immediately](err-check-immediately.md) - Checking `err` right where it's declared
