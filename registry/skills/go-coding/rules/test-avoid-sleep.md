# test-avoid-sleep

> Avoid `time.Sleep` for synchronization in tests; wait on a real signal instead

## Why It Matters

`time.Sleep(100 * time.Millisecond)` as a way to "wait for a goroutine to finish" is a guess, not a guarantee - it makes tests flaky (fails intermittently under CI load when the sleep duration turns out to be too short) and slow (the sleep duration is often padded generously "just in case," inflating the suite's total run time for no benefit).

## Bad

```go
func TestAsyncProcess(t *testing.T) {
	result := &Result{}
	go func() {
		process(result)
	}()

	time.Sleep(100 * time.Millisecond) // guess: is this always enough time?
	if !result.Done {
		t.Error("expected process to complete")
	}
}
```

## Good

```go
func TestAsyncProcess(t *testing.T) {
	done := make(chan struct{})
	result := &Result{}
	go func() {
		process(result)
		close(done)
	}()

	select {
	case <-done:
		if !result.Done {
			t.Error("expected process to complete")
		}
	case <-time.After(5 * time.Second): // generous upper bound, not a guess about the real timing
		t.Fatal("timed out waiting for process to complete")
	}
}
```

## Waiting on a WaitGroup Instead

```go
func TestConcurrentWrites(t *testing.T) {
	var wg sync.WaitGroup
	c := &Counter{}
	wg.Add(10)
	for i := 0; i < 10; i++ {
		go func() {
			defer wg.Done()
			c.Inc()
		}()
	}
	wg.Wait() // deterministic: returns exactly when all goroutines are done, no guessing
	if c.Value() != 10 {
		t.Errorf("Value() = %d, want 10", c.Value())
	}
}
```

## Polling as a Last Resort (Still Better Than a Fixed Sleep)

```go
func waitFor(t *testing.T, timeout time.Duration, cond func() bool) {
	t.Helper()
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if cond() {
			return
		}
		time.Sleep(10 * time.Millisecond) // short poll interval, bounded by an overall timeout
	}
	t.Fatal("condition not met before timeout")
}
```

Polling with a short interval and an overall deadline is acceptable when there's genuinely no channel/signal to wait on directly (e.g., waiting for an external process to write a file) - it's the *unconditional fixed sleep* that's the anti-pattern, not all time-based waiting.

## See Also

- [conc-waitgroup-usage](conc-waitgroup-usage.md) - The deterministic synchronization primitive used above
- [conc-select-timeout](conc-select-timeout.md) - The `select`/timeout pattern applied to test code
- [conc-race-detector-ci](conc-race-detector-ci.md) - Running these tests with `-race` to catch synchronization bugs directly
