# anti-goroutine-leak

> Don't spawn a goroutine with no path to ever terminate

## Why It Matters

A leaked goroutine - one blocked forever on a channel that will never receive, or looping without a cancellation check - never gets garbage collected (goroutines aren't tracked by the GC the way memory is; they're tracked by the scheduler and live until they return). Enough leaked goroutines over the life of a long-running process exhausts memory and scheduler capacity, and the leak is often invisible until `runtime.NumGoroutine()` or a profiler is checked under load.

## Bad

```go
func process(items []Item) <-chan Result {
	out := make(chan Result) // unbuffered
	go func() {
		for _, item := range items {
			out <- compute(item) // if the caller stops reading early, this send blocks FOREVER
		}
		close(out)
	}()
	return out
}

func main() {
	results := process(items)
	first := <-results // only reads ONE result, then moves on
	use(first)
	// The goroutine inside process is now stuck forever on its second send -
	// leaked for the remaining lifetime of the process.
}
```

## Good

```go
func process(ctx context.Context, items []Item) <-chan Result {
	out := make(chan Result)
	go func() {
		defer close(out)
		for _, item := range items {
			select {
			case out <- compute(item):
			case <-ctx.Done(): // gives the goroutine a way to exit if the caller stops consuming
				return
			}
		}
	}()
	return out
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel() // ensures the goroutine above can always exit, even if we stop reading early

	results := process(ctx, items)
	first := <-results
	use(first)
}
```

## Detecting Leaks

```go
func TestNoGoroutineLeak(t *testing.T) {
	before := runtime.NumGoroutine()
	// ... run the code under test, ensure it fully completes/is cancelled ...
	runtime.GC()
	time.Sleep(10 * time.Millisecond) // allow scheduler to clean up finished goroutines
	after := runtime.NumGoroutine()
	if after > before {
		t.Errorf("goroutine leak: had %d, now %d", before, after)
	}
}
```

Libraries like `go.uber.org/goleak` automate this exact check and are commonly run as a `TestMain` hook across an entire test suite.

## See Also

- [conc-goroutine-lifecycle](conc-goroutine-lifecycle.md) - The checklist that prevents this anti-pattern in the first place
- [conc-select-timeout](conc-select-timeout.md) - The `select`/`ctx.Done()` pattern used above to make a send cancellable
- [conc-channel-buffered-backpressure](conc-channel-buffered-backpressure.md) - Buffering alone doesn't fix this - it only delays it
