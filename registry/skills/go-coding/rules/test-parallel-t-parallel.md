# test-parallel-t-parallel

> Call `t.Parallel()` to run independent tests concurrently

## Why It Matters

By default, Go runs tests within a package sequentially. For a large test suite where most tests are independent (no shared mutable state, no port/file conflicts), marking them parallel with `t.Parallel()` lets the test runner execute them concurrently, often cutting total suite time dramatically on multi-core machines.

## Bad

```go
func TestFetchUser(t *testing.T) {
	// each of these runs one after another, even though they're fully independent
	srv := newTestServer(t)
	testFetch(t, srv, "1")
}

func TestFetchOrder(t *testing.T) {
	srv := newTestServer(t)
	testFetch(t, srv, "2")
}
```

## Good

```go
func TestFetchUser(t *testing.T) {
	t.Parallel() // marks this test as safe to run concurrently with other parallel tests
	srv := newTestServer(t)
	testFetch(t, srv, "1")
}

func TestFetchOrder(t *testing.T) {
	t.Parallel()
	srv := newTestServer(t)
	testFetch(t, srv, "2")
}
```

## Parallel Subtests Within a Table

```go
func TestValidate(t *testing.T) {
	cases := []struct{ name, input string; valid bool }{
		{"valid", "a@b.com", true},
		{"invalid", "nope", false},
	}
	for _, c := range cases {
		c := c // still safe/explicit even on Go 1.22+, and required pre-1.22
		t.Run(c.name, func(t *testing.T) {
			t.Parallel() // subtests run concurrently with each other
			if got := Validate(c.input); got != c.valid {
				t.Errorf("Validate(%q) = %v, want %v", c.input, got, c.valid)
			}
		})
	}
}
```

## When NOT to Mark a Test Parallel

- It mutates shared package-level state (a global cache, an env var) that another parallel test also touches.
- It binds a fixed, non-ephemeral network port or writes to a fixed file path another test also uses.
- It depends on `t.Setenv`, which itself panics if called from a parallel test alongside other environment mutations in the same run.

## Controlling Parallelism

```sh
go test -parallel 8 ./... # cap the number of tests running concurrently (default: GOMAXPROCS)
```

## See Also

- [test-subtests-t-run](test-subtests-t-run.md) - The subtest structure this often runs within
- [conc-race-detector-ci](conc-race-detector-ci.md) - Run parallel tests with `-race` to catch shared-state bugs they expose
- [test-cleanup-t-cleanup](test-cleanup-t-cleanup.md) - Ensuring per-test resources are released even when running in parallel
