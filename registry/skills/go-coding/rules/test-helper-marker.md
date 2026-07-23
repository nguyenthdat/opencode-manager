# test-helper-marker

> Call `t.Helper()` in test helper functions so failures report the right line

## Why It Matters

Without `t.Helper()`, a failure inside a shared assertion/setup helper reports the line number *inside the helper*, not the line in the actual test that called it - forcing you to dig through indirection to find which test case actually failed. `t.Helper()` tells the testing framework to attribute failures to the caller's line instead.

## Bad

```go
func assertEqual(t *testing.T, got, want int) {
	if got != want { // no t.Helper() - failure reports THIS line, not the caller's
		t.Errorf("got %d, want %d", got, want)
	}
}

func TestCompute(t *testing.T) {
	assertEqual(t, Compute(2, 3), 5) // failure output points into assertEqual, not here
}
```

## Good

```go
func assertEqual(t *testing.T, got, want int) {
	t.Helper() // failures now report the calling test's line, not this one
	if got != want {
		t.Errorf("got %d, want %d", got, want)
	}
}

func TestCompute(t *testing.T) {
	assertEqual(t, Compute(2, 3), 5) // failure correctly points to THIS line
}
```

## Applies to Setup/Fixture Helpers Too

```go
func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(handler())
	t.Cleanup(srv.Close)
	return srv
}

func TestHandler(t *testing.T) {
	srv := newTestServer(t) // if newTestServer ever fails an assertion, it points here
	// ...
}
```

## Nested Helpers

```go
func assertNoError(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func assertUserValid(t *testing.T, u *User) {
	t.Helper() // each layer marks itself, so failures always bubble up to the real test
	assertNoError(t, u.Validate())
}
```

## Rule of Thumb

Any function that takes `*testing.T` as a parameter and calls one of its failure methods (`Error`, `Errorf`, `Fatal`, `Fatalf`) on behalf of a caller should call `t.Helper()` as its first statement.

## See Also

- [test-table-driven](test-table-driven.md) - Table-driven tests commonly call shared assertion helpers like this
- [test-cleanup-t-cleanup](test-cleanup-t-cleanup.md) - Another `*testing.T` mechanism commonly used inside helpers
- [test-descriptive-names](test-descriptive-names.md) - Clear failure messages complement accurate line attribution
