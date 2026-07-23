# test-race-flag

> Write tests that actually exercise concurrent paths, then run them with `-race`

## Why It Matters

The race detector (`go test -race`) only flags races in code paths a test run actually executes concurrently. A test suite with no genuinely concurrent test cases gets zero benefit from `-race`, even if the production code has real races - the detector can't find what it never observes running.

## Bad

```go
func TestCache(t *testing.T) {
	c := NewCache()
	c.Set("a", 1) // sequential access only - never exercises the type's
	v := c.Get("a") // internal locking under actual concurrent load
	if v != 1 {
		t.Errorf("Get(a) = %d, want 1", v)
	}
}
// `go test -race` passes here even if Cache.Set/Get have a genuine data race,
// because this test never calls them from more than one goroutine.
```

## Good

```go
func TestCacheConcurrentAccess(t *testing.T) {
	c := NewCache()
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(2)
		go func(i int) {
			defer wg.Done()
			c.Set(fmt.Sprintf("key%d", i), i)
		}(i)
		go func(i int) {
			defer wg.Done()
			c.Get(fmt.Sprintf("key%d", i)) // reads and writes interleaved from many goroutines
		}(i)
	}
	wg.Wait()
}
```

Run with:

```sh
go test -race -run TestCacheConcurrentAccess ./...
```

## Designing Tests Specifically to Trigger Concurrent Paths

- Spawn multiple goroutines performing the *same* operation (`Set`) and different operations (`Set`/`Get`/`Delete`) against a shared instance.
- Use `sync.WaitGroup` (not `time.Sleep`) to ensure all goroutines actually run before the test asserts final state.
- Run with a higher `GOMAXPROCS` locally if the race is timing-sensitive and doesn't reproduce reliably: `GOMAXPROCS=4 go test -race -count=20 ./...` (repeat with `-count` to increase the chance of hitting a rare race window).

## See Also

- [conc-race-detector-ci](conc-race-detector-ci.md) - Wiring `-race` into CI so this runs on every change
- [test-avoid-sleep](test-avoid-sleep.md) - Replacing sleep-based synchronization with deterministic waits in these same tests
- [conc-mutex-minimal-scope](conc-mutex-minimal-scope.md) - The kind of production bug these concurrent tests are meant to catch
