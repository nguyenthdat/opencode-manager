# err-as-type-assert

> Use `errors.As` to extract a typed error from a chain

## Why It Matters

A type assertion (`err.(*MyError)`) only matches if `err` is exactly that type - it fails against a wrapped error. `errors.As` walks the `Unwrap()` chain looking for the first error that matches the target type, and assigns it into the pointer you pass, so you can read its fields.

## Bad

```go
func handle(err error) {
	// Fails whenever err has been wrapped by an intermediate layer
	if pathErr, ok := err.(*os.PathError); ok {
		log.Printf("path error on %s", pathErr.Path)
	}
}
```

## Good

```go
func handle(err error) {
	var pathErr *os.PathError
	if errors.As(err, &pathErr) {
		log.Printf("path error on %s: %v", pathErr.Path, pathErr.Err)
	}

	var valErr *ValidationError
	if errors.As(err, &valErr) {
		log.Printf("invalid field %s", valErr.Field)
	}
}
```

## Full Example

```go
type RateLimitError struct {
	RetryAfter time.Duration
}

func (e *RateLimitError) Error() string {
	return fmt.Sprintf("rate limited, retry after %s", e.RetryAfter)
}

func callAPI() error {
	resp, err := http.Get(apiURL)
	if err != nil {
		return fmt.Errorf("call api: %w", err)
	}
	if resp.StatusCode == http.StatusTooManyRequests {
		return fmt.Errorf("call api: %w", &RateLimitError{RetryAfter: 30 * time.Second})
	}
	return nil
}

func main() {
	err := callAPI()
	var rle *RateLimitError
	if errors.As(err, &rle) {
		time.Sleep(rle.RetryAfter)
	}
}
```

## Target Must Be a Pointer to an Error Type

`errors.As` panics if the second argument isn't a non-nil pointer to a type implementing `error` (or an interface type). Always pass `&typedVar`, never `typedVar`.

## See Also

- [err-is-not-equality](err-is-not-equality.md) - Sibling function for sentinel identity checks
- [err-custom-type](err-custom-type.md) - Defining the custom error types this rule extracts
- [err-wrap-fmt-w](err-wrap-fmt-w.md) - Wrapping errors so the chain is walkable
