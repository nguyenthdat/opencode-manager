# conc-goroutine-lifecycle

> Every goroutine you start needs a clear owner and a way to stop

## Why It Matters

A goroutine that's spawned with no path to termination - no cancellation signal, no way for its caller to know it finished - either leaks forever (if blocked) or keeps running unsupervised after the code that cared about its result has moved on. Before writing `go func() { ... }()`, know how it will stop and who is responsible for waiting on it.

## Bad

```go
func StartMonitor() {
	go func() {
		for {
			checkHealth()
			time.Sleep(time.Second)
		}
		// No way to stop this. It runs until the process exits.
	}()
}

func handleRequest(r *Request) {
	go processAsync(r) // fire-and-forget: no one waits, no way to cancel, errors vanish
}
```

## Good

```go
func StartMonitor(ctx context.Context) <-chan struct{} {
	done := make(chan struct{})
	go func() {
		defer close(done)
		ticker := time.NewTicker(time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				checkHealth()
			}
		}
	}()
	return done
}

func handleRequest(ctx context.Context, r *Request) error {
	errCh := make(chan error, 1)
	go func() {
		errCh <- processAsync(ctx, r)
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		return ctx.Err()
	}
}
```

## Checklist Before Spawning a Goroutine

1. **Stop condition** - a `context.Context`, a `done`/`quit` channel, or a natural loop exit.
2. **Completion signal** - a `sync.WaitGroup`, a channel close, or a returned error channel so callers can observe when it's done.
3. **Panic safety** - an unhandled panic in a goroutine crashes the whole process; wrap risky work (see `err-recover-boundary`).
4. **Bounded lifetime** - know whether it lives for one request, the process lifetime, or something in between, and document it.

## See Also

- [conc-waitgroup-usage](conc-waitgroup-usage.md) - The standard tool for waiting on goroutine completion
- [anti-goroutine-leak](anti-goroutine-leak.md) - What happens when this checklist is skipped
- [err-recover-boundary](err-recover-boundary.md) - Recovering panics inside a goroutine
