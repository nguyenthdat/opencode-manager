# test-cleanup-t-cleanup

> Use `t.Cleanup()` for teardown instead of manual `defer` in test helpers

## Why It Matters

`t.Cleanup(fn)` registers a function to run after the test (and its subtests) complete, in LIFO order - regardless of whether the test passed, failed, or called `t.Fatal`. Unlike a bare `defer` inside a helper function, cleanup registered via `t.Cleanup` composes correctly across helper functions and subtests without requiring every helper to return a closer that the caller must remember to `defer` itself.

## Bad

```go
func newTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("postgres", testDSN)
	if err != nil {
		t.Fatalf("open test db: %v", err)
	}
	return db // caller must remember to defer db.Close() themselves - easy to forget
}

func TestQuery(t *testing.T) {
	db := newTestDB(t)
	defer db.Close() // works, but only if every caller remembers this line
	// ...
}
```

## Good

```go
func newTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("postgres", testDSN)
	if err != nil {
		t.Fatalf("open test db: %v", err)
	}
	t.Cleanup(func() {
		if err := db.Close(); err != nil {
			t.Errorf("close test db: %v", err)
		}
	})
	return db // cleanup is guaranteed - the caller doesn't need to remember anything
}

func TestQuery(t *testing.T) {
	db := newTestDB(t) // no defer needed at the call site at all
	// ...
}
```

## Composing Cleanup Across Layers

```go
func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	db := newTestDB(t)          // registers its own cleanup
	srv := httptest.NewServer(newHandler(db))
	t.Cleanup(srv.Close)        // registers this layer's cleanup too - runs before db's, LIFO order
	return srv
}
```

## Cleanup Runs Even on `t.Fatal`

```go
func TestSomething(t *testing.T) {
	db := newTestDB(t)
	if !preconditionMet() {
		t.Fatal("precondition not met") // db's cleanup still runs via t.Cleanup, unlike a skipped defer
	}
	// ...
}
```

## See Also

- [test-helper-marker](test-helper-marker.md) - Marking these same setup helpers with `t.Helper()`
- [test-parallel-t-parallel](test-parallel-t-parallel.md) - Ensuring cleanup is scoped correctly for parallel tests
- [test-httptest-server](test-httptest-server.md) - `httptest.Server`, a common resource managed with `t.Cleanup`
