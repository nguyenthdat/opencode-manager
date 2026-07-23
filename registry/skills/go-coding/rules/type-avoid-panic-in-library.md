# type-avoid-panic-in-library

> Library code returns errors; it does not panic on bad input or failure

## Why It Matters

A panic propagates up through every caller's call stack until something recovers it - and most application code never expects a library call to panic, so it doesn't wrap calls in `recover`. A library that panics on conditions a caller could reasonably encounter (bad input, a closed connection, a missing key) forces every consumer to either avoid triggering the panic perfectly or wrap every call in defensive `recover` boilerplate.

## Bad

```go
package validator

func MustValidate(input string) { // panics on any invalid input - callers can't recover gracefully
	if len(input) == 0 {
		panic("validator: input must not be empty")
	}
	if !isValidFormat(input) {
		panic("validator: invalid format")
	}
}

// Every caller now needs a recover() just to call this safely with untrusted input:
func handle(input string) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("validation panicked: %v", r)
		}
	}()
	validator.MustValidate(input)
	return nil
}
```

## Good

```go
package validator

func Validate(input string) error {
	if len(input) == 0 {
		return errors.New("validator: input must not be empty")
	}
	if !isValidFormat(input) {
		return errors.New("validator: invalid format")
	}
	return nil
}

func handle(input string) error {
	if err := validator.Validate(input); err != nil {
		return fmt.Errorf("handle: %w", err)
	}
	return nil
}
```

## The `Must`-Prefix Convention for the Rare Legitimate Panic

```go
// A Must-prefixed function documents, by name, that it panics - reserve this
// convention for cases where failure indicates a static, build-time-verifiable
// error (a hardcoded regex, an embedded template), not runtime/user input.
var pattern = regexp.MustCompile(`^\d+$`) // panics only if the literal pattern itself is malformed

func MustParseURL(raw string) *url.URL { // acceptable ONLY for compile-time-known, trusted literals
	u, err := url.Parse(raw)
	if err != nil {
		panic(err)
	}
	return u
}
```

Even `Must`-prefixed functions should never be called with untrusted, runtime-supplied input - that reintroduces the exact problem this rule prevents.

## See Also

- [err-panic-programmer-bugs](err-panic-programmer-bugs.md) - The general principle this rule specializes for library code
- [err-return-early](err-return-early.md) - Returning errors instead of panicking, applied broadly
- [anti-panic-recover-control-flow](anti-panic-recover-control-flow.md) - The related anti-pattern of using panic for control flow
