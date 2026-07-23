# conc-worker-pool-bounded

> Use a bounded worker pool instead of spawning a goroutine per unit of work

## Why It Matters

Spawning one goroutine per incoming item scales linearly with input size - fine for small batches, dangerous for large or attacker-controlled ones, since each goroutine still costs memory (starting stack, scheduler bookkeeping) and can exhaust file descriptors, memory, or downstream connection limits under load. A bounded pool of workers caps concurrency to a number you've chosen deliberately.

## Bad

```go
func processAll(items []Item) {
	for _, item := range items {
		go process(item) // unbounded: 1,000,000 items -> 1,000,000 goroutines at once
	}
}
```

## Good

```go
func processAll(ctx context.Context, items []Item, workerCount int) error {
	jobs := make(chan Item)
	g, ctx := errgroup.WithContext(ctx)

	for w := 0; w < workerCount; w++ {
		g.Go(func() error {
			for item := range jobs {
				if err := process(ctx, item); err != nil {
					return err
				}
			}
			return nil
		})
	}

	g.Go(func() error {
		defer close(jobs)
		for _, item := range items {
			select {
			case jobs <- item:
			case <-ctx.Done():
				return ctx.Err()
			}
		}
		return nil
	})

	return g.Wait()
}
```

## Choosing the Worker Count

```go
// CPU-bound work: match GOMAXPROCS (usually the number of usable cores).
workers := runtime.GOMAXPROCS(0)

// IO-bound work: often benefits from oversubscription, but bound it to a
// number your downstream (DB pool, HTTP client) can actually sustain.
workers := 32
```

## See Also

- [conc-channel-buffered-backpressure](conc-channel-buffered-backpressure.md) - Sizing the job queue that feeds workers
- [conc-errgroup-parallel](conc-errgroup-parallel.md) - `errgroup.SetLimit` as a simpler bounded-concurrency alternative
- [anti-goroutine-per-request-unbounded](anti-goroutine-per-request-unbounded.md) - The anti-pattern this rule replaces
