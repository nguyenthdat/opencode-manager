# err-nil-check-interface

> A typed nil stored in an `error` interface is not `== nil`

## Why It Matters

An interface value is nil only when both its type and value are nil. If you return a nil pointer of a concrete error type through an `error`-typed return, the interface has a non-nil type descriptor (`*MyError`) even though the pointer itself is nil - so `err != nil` is true, and callers treat a "no error" case as a failure.

## Bad

```go
type MyError struct{ msg string }

func (e *MyError) Error() string { return e.msg }

func doWork() *MyError {
	// ... on success, returns nil *MyError
	return nil
}

func run() error {
	var err *MyError = doWork()
	return err // BUG: returns a non-nil error interface wrapping a nil *MyError
}

func main() {
	if err := run(); err != nil {
		fmt.Println("failed:", err) // prints even though nothing failed!
	}
}
```

## Good

```go
func doWork() error { // return the interface type directly, not the concrete pointer
	// ... success path
	return nil
}

func run() error {
	if err := doWork(); err != nil {
		return err
	}
	return nil
}
```

## The Rule

Never declare a function to return a concrete pointer-to-error type (`*MyError`) when the intent is "this satisfies `error`". Always declare the return type as `error`, and only assign a genuine non-nil `*MyError` value to it when there's an actual failure. Assigning `nil` of the concrete type to an `error` variable is the same trap:

```go
var perr *MyError // nil pointer
var err error = perr
fmt.Println(err == nil) // false! err's type is *MyError, value is nil
```

## Detecting This Bug

`go vet` and `staticcheck` (`SA4023`) both flag comparisons that are always true/false due to this pattern. Keep them enabled in CI.

## See Also

- [err-is-not-equality](err-is-not-equality.md) - Related but distinct: comparing wrapped errors
- [type-nil-interface-pitfall](type-nil-interface-pitfall.md) - The same nil-interface issue applies beyond just `error`
- [lint-staticcheck-enabled](lint-staticcheck-enabled.md) - Static analysis that catches this class of bug
