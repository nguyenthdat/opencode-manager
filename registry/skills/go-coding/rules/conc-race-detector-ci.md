# conc-race-detector-ci

> Run `go test -race` in CI for every package with concurrent code

## Why It Matters

Data races are undefined behavior in Go - a racy program can appear to work correctly for months and then corrupt memory or crash unpredictably under load. The race detector instruments memory accesses at compile time and reliably catches races that occur during a test run, but only if the race-enabled binary is actually executed with inputs that trigger the racing code paths.

## Bad

```yaml
# CI runs tests without -race - races go undetected until they hit production
- run: go test ./...
```

```go
// This test passes without -race, but is actually racy:
func TestCounter(t *testing.T) {
	c := &Counter{}
	for i := 0; i < 100; i++ {
		go c.Inc() // no synchronization on completion, and Inc itself may not be synchronized
	}
	time.Sleep(100 * time.Millisecond) // guesswork instead of real synchronization
	if c.Value() != 100 {
		t.Fatalf("got %d, want 100", c.Value())
	}
}
```

## Good

```yaml
# .github/workflows/ci.yml
- run: go test -race -shuffle=on ./...
```

```go
func TestCounter(t *testing.T) {
	c := &Counter{}
	var wg sync.WaitGroup
	wg.Add(100)
	for i := 0; i < 100; i++ {
		go func() {
			defer wg.Done()
			c.Inc()
		}()
	}
	wg.Wait() // real synchronization instead of a sleep
	if got := c.Value(); got != 100 {
		t.Fatalf("got %d, want 100", got)
	}
}
```

## Notes on the Race Detector

- It only detects races in code paths actually exercised during the run - it's not static analysis. Write tests that genuinely exercise concurrent access patterns.
- `-race` roughly doubles memory use and slows execution significantly; that's expected and worth the cost in CI.
- `-shuffle=on` randomizes test execution order, which helps surface ordering-dependent bugs (including some races) that a fixed order hides.
- Enable it for both `go test` and any long-running integration/soak tests, not just unit tests.

## See Also

- [test-race-flag](test-race-flag.md) - Test-writing practices that pair with the race detector
- [test-avoid-sleep](test-avoid-sleep.md) - Replacing `time.Sleep` synchronization guesswork with real signals
- [anti-shared-state-no-sync](anti-shared-state-no-sync.md) - The class of bug the race detector is built to catch
