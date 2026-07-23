# err-custom-type

> Define custom error types for errors that carry structured data

## Why It Matters

A plain string error can only tell the caller "something went wrong." A custom error type can carry a status code, field name, or retry hint, and callers can extract that data with `errors.As` instead of scraping the message string.

## Bad

```go
func Validate(field string, value int) error {
	if value < 0 {
		// Caller has no structured way to learn which field failed
		return fmt.Errorf("validation failed: field %q has negative value %d", field, value)
	}
	return nil
}
```

## Good

```go
type ValidationError struct {
	Field string
	Value int
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("field %q: invalid value %d", e.Field, e.Value)
}

func Validate(field string, value int) error {
	if value < 0 {
		return &ValidationError{Field: field, Value: value}
	}
	return nil
}

// Caller:
err := Validate("age", -1)
var verr *ValidationError
if errors.As(err, &verr) {
	log.Printf("invalid field: %s", verr.Field)
}
```

## Supporting Unwrap for Chaining

```go
type QueryError struct {
	Query string
	Err   error
}

func (e *QueryError) Error() string { return fmt.Sprintf("query %q: %v", e.Query, e.Err) }
func (e *QueryError) Unwrap() error { return e.Err } // enables errors.Is/errors.As on e.Err too

func Run(q string) error {
	if err := db.Exec(q); err != nil {
		return &QueryError{Query: q, Err: err}
	}
	return nil
}
```

## When a Sentinel Is Enough

If the caller only needs to branch on "did this specific condition happen" with no extra data, a `var ErrX = errors.New(...)` sentinel is simpler than a custom type. Reach for a custom type when callers need fields, not just identity.

## See Also

- [err-sentinel-var](err-sentinel-var.md) - Simpler alternative when no structured data is needed
- [err-as-type-assert](err-as-type-assert.md) - Extracting custom error types with `errors.As`
- [err-wrap-fmt-w](err-wrap-fmt-w.md) - Wrapping with `%w` vs. an `Unwrap()` method
