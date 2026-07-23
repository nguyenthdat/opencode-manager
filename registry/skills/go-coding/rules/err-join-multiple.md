# err-join-multiple

> Use `errors.Join` to combine multiple independent errors into one

## Why It Matters

Some operations can fail in more than one independent way at once (closing several resources, validating multiple fields). Returning only the first error silently drops the others. `errors.Join` (Go 1.20+) combines multiple errors into a single error value that still works with `errors.Is`/`errors.As` against any of the joined errors.

## Bad

```go
func closeAll(closers []io.Closer) error {
	for _, c := range closers {
		if err := c.Close(); err != nil {
			return err // only the first failure is reported; rest are silently skipped
		}
	}
	return nil
}
```

## Good

```go
func closeAll(closers []io.Closer) error {
	var errs []error
	for _, c := range closers {
		if err := c.Close(); err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...) // returns nil if errs is empty
}

// errors.Is/errors.As search through every joined error:
err := closeAll(closers)
if errors.Is(err, os.ErrClosed) {
	// true if ANY closer returned os.ErrClosed
}
```

## Validation Example

```go
func Validate(f Form) error {
	var errs []error
	if f.Name == "" {
		errs = append(errs, errors.New("name is required"))
	}
	if f.Age < 0 {
		errs = append(errs, errors.New("age must not be negative"))
	}
	return errors.Join(errs...) // nil if no validation errors
}
```

## Formatting

`errors.Join` renders joined errors one per line when formatted with `%v` or `.Error()`. If you need a single-line summary instead, join the individual `.Error()` strings yourself.

## See Also

- [err-wrap-fmt-w](err-wrap-fmt-w.md) - Wrapping a single error with context vs. joining several
- [err-is-not-equality](err-is-not-equality.md) - `errors.Is` searches joined errors the same way it searches wrapped ones
- [conc-errgroup-parallel](conc-errgroup-parallel.md) - `errgroup` returns only the first error; use `errors.Join` when you need all of them
