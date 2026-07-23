# err-is-not-equality

> Use `errors.Is` to compare errors, not `==`

## Why It Matters

Once errors are wrapped with `%w`, the value returned to the caller is no longer the original sentinel - it's a wrapper around it. A direct `==` comparison fails silently against wrapped errors. `errors.Is` walks the `Unwrap()` chain and also respects a type's custom `Is(error) bool` method.

## Bad

```go
func process(path string) error {
	_, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("process %s: %w", path, err)
	}
	return nil
}

err := process("missing.txt")
if err == os.ErrNotExist { // always false: err is a wrapped *fmt.wrapError
	fmt.Println("file missing")
}
```

## Good

```go
err := process("missing.txt")
if errors.Is(err, os.ErrNotExist) {
	fmt.Println("file missing")
}

if errors.Is(err, context.Canceled) {
	return nil // caller cancelled, not a real failure
}
```

## Custom `Is` Method

```go
type CodeError struct{ Code int }

func (e *CodeError) Error() string { return fmt.Sprintf("code %d", e.Code) }

// Is lets errors.Is(err, target) match by field value instead of pointer identity.
func (e *CodeError) Is(target error) bool {
	t, ok := target.(*CodeError)
	return ok && t.Code == e.Code
}
```

## When `==` Is Still Fine

Comparing an error you just received directly against `nil` is the one place `==` is correct and idiomatic:

```go
if err != nil {
	return err
}
```

Only sentinel/wrapped-error identity checks need `errors.Is`.

## See Also

- [err-sentinel-var](err-sentinel-var.md) - Declaring the sentinel errors this rule compares against
- [err-as-type-assert](err-as-type-assert.md) - Extracting data from a matched error with `errors.As`
- [err-nil-check-interface](err-nil-check-interface.md) - A related pitfall comparing typed nils to `nil`
